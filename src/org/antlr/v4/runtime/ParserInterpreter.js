/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.ParserInterpreter');


const Token = goog.require('org.antlr.v4.runtime.Token');
const Parser = goog.require('org.antlr.v4.runtime.Parser');
const InterpreterRuleContext = goog.require('org.antlr.v4.runtime.InterpreterRuleContext');
const InputMismatchException = goog.require('org.antlr.v4.runtime.InputMismatchException');
const FailedPredicateException = goog.require('org.antlr.v4.runtime.FailedPredicateException');
const ATN = goog.require('org.antlr.v4.runtime.atn.ATN');
const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');
const ActionTransition = goog.require('org.antlr.v4.runtime.atn.ActionTransition');
const DecisionState = goog.require('org.antlr.v4.runtime.atn.DecisionState');
const LoopEndState = goog.require('org.antlr.v4.runtime.atn.LoopEndState');
const ParserATNSimulator = goog.require('org.antlr.v4.runtime.atn.ParserATNSimulator');
const PrecedencePredicateTransition = goog.require('org.antlr.v4.runtime.atn.PrecedencePredicateTransition');
const PredicateTransition = goog.require('org.antlr.v4.runtime.atn.PredicateTransition');
const PredictionContextCache = goog.require('org.antlr.v4.runtime.atn.PredictionContextCache');
const RuleStartState = goog.require('org.antlr.v4.runtime.atn.RuleStartState');
const RuleTransition = goog.require('org.antlr.v4.runtime.atn.RuleTransition');
const StarLoopEntryState = goog.require('org.antlr.v4.runtime.atn.StarLoopEntryState');
const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');
const DFA = goog.require('org.antlr.v4.runtime.dfa.DFA');
const Pair = goog.require('org.antlr.v4.runtime.misc.Pair');
const {format} = goog.require('goog.string');

/** A parser simulator that mimics what ANTLR's generated
 *  parser code does. A ParserATNSimulator is used to make
 *  predictions via adaptivePredict but this class moves a pointer through the
 *  ATN to simulate parsing. ParserATNSimulator just
 *  makes us efficient rather than having to backtrack, for example.
 *
 *  This properly creates parse trees even for left recursive rules.
 *
 *  We rely on the left recursive rule invocation and special predicate
 *  transitions to make left recursive rules work.
 *
 *  See TestParserInterpreter for examples.
 */
class ParserInterpreter extends Parser {
    /**
     *
     * @param {string} grammarFileName
     * @param {org.antlr.v4.runtime.Vocabulary} vocabulary
     * @param {Array<string>} ruleNames
     * @param {ATN} atn
     * @param {org.antlr.v4.runtime.TokenStream} input
     */
    constructor(grammarFileName, vocabulary, ruleNames, atn, input) {
        super(input);
        /**
         * @protected {string}
         */
        this.grammarFileName = grammarFileName;
        /**
         * @protected {ATN}
         */
        this.atn = atn;
        /**
         * @protected {Array<org.antlr.v4.runtime.dfa.DFA>}
         */
        this.decisionToDFA = []; // not shared like it is for generated parsers
        for (var i = 0; i < atn.getNumberOfDecisions(); i++) {
            this.decisionToDFA[i] = new DFA(atn.getDecisionState(i), i);
        }
        /**
         * @protected {PredictionContextCache}
         */
        this.sharedContextCache = new PredictionContextCache();
        /**
         * @deprecated
         * @protected {Array<string>}
         */
        this.tokenNames = [];
        for (var i = 0; i < atn.maxTokenType; i++) {
            this.tokenNames[i] = vocabulary.getDisplayName(i);
        }
        /**
         * @protected {Array<string>}
         */
        this.ruleNames = ruleNames;
        /**
         * @private {org.antlr.v4.runtime.Vocabulary}
         */
        this.vocabulary = vocabulary;
        /**
         * This stack corresponds to the _parentctx, _parentState pair of locals
         * that would exist on call stack frames with a recursive descent parser;
         * in the generated function for a left-recursive rule you'd see:
         *
         * private EContext e(int _p) throws RecognitionException {
         *     ParserRuleContext _parentctx = _ctx;    // Pair.a
         *     int _parentState = getState();          // Pair.b
         *     ...
         * }
         *
         * Those values are used to create new recursive rule invocation contexts
         * associated with left operand of an alt like "expr '*' expr".
         *
         * @protected {Array<Pair<org.antlr.v4.runtime.ParserRuleContext, number>>}
         */
        this._parentContextStack = [];
        /**
         * We need a map from (decision,inputIndex)->forced alt for computing ambiguous
         * parse trees. For now, we allow exactly one override.
         *
         * @protected {number}
         */
        this.overrideDecision = -1;
        /**
         * @protected {number}
         */
        this.overrideDecisionInputIndex = -1;
        /**
         * @protected {number}
         */
        this.overrideDecisionAlt = -1;
        /**
         * @protected {boolean}
         */
        this.overrideDecisionReached = false; // latch and only override once; error might trigger infinite loop
        /**
         * What is the current context when we override a decisions?  This tells
         * us what the root of the parse tree is when using override
         * for an ambiguity/lookahead check.
         *
         * @protected {InterpreterRuleContext}
         */
        this.overrideDecisionRoot = null;
        /**
         * @protected {InterpreterRuleContext}
         */
        this.rootContext = null;

        // get atn simulator that knows how to do predictions
        this.setInterpreter(new ParserATNSimulator(this, this.atn,
            this.decisionToDFA, this.sharedContextCache));
    }

    reset() {
        super.reset();
        this.overrideDecisionReached = false;
        this.overrideDecisionRoot = null;
    }

    getATN() {
        return this.atn;
    }

    getTokenNames() {
        return this.tokenNames;
    }

    getVocabulary() {
        return this.vocabulary;
    }

    getRuleNames() {
        return this.ruleNames;
    }

    getGrammarFileName() {
        return this.grammarFileName;
    }

    /**
     * Begin parsing at startRuleIndex
     *
     * @param {number} startRuleIndex
     * @return {org.antlr.v4.runtime.ParserRuleContext}
     */
    parse(startRuleIndex) {
        var startRuleStartState = this.atn.ruleToStartState[startRuleIndex];
        this.rootContext = this.createInterpreterRuleContext(null, ATNState.INVALID_STATE_NUMBER, startRuleIndex);
        if (startRuleStartState.isLeftRecursiveRule) {
            this.enterRecursionRule(this.rootContext, startRuleStartState.stateNumber, startRuleIndex, 0);
        }
        else {
            this.enterRule(this.rootContext, startRuleStartState.stateNumber, startRuleIndex);
        }

        while (true) {
            var p = this.getATNState();
            switch (p.getStateType()) {
            case ATNState.RULE_STOP:
                // pop; return from rule
                if (this._ctx.isEmpty()) {
                    if (startRuleStartState.isLeftRecursiveRule) {
                        var result = this._ctx;
                        var parentContext = this._parentContextStack.pop();
                        this.unrollRecursionContexts(parentContext.a);
                        return result;
                    }
                    else {
                        this.exitRule();
                        return this.rootContext;
                    }
                }

                this.visitRuleStopState(p);
                break;

            default :
                try {
                    this.visitState(p);
                }
                catch (e) {
                    this.setState(this.atn.ruleToStopState[p.ruleIndex].stateNumber);
                    this.getContext().exception = e;
                    this.getErrorHandler().reportError(this, e);
                    this.recover(e);
                }

                break;
            }
        }
    }

    enterRecursionRule(localctx, state, ruleIndex, precedence) {
        /**
         * @type {Pair<org.antlr.v4.runtime.ParserRuleContext, number>}
         */
        var pair = new Pair(this._ctx, localctx.invokingState);
        this._parentContextStack.push(pair);
        super.enterRecursionRule(localctx, state, ruleIndex, precedence);
    }

    /**
     * @protected
     * @return {ATNState}
     */
    getATNState() {
        return this.atn.states[this.getState()];
    }

    /**
     * @param {ATNState} p
     * @return {void}
     */
    visitState(p) {
        var predictedAlt = 1;
        if (p instanceof DecisionState) {
            predictedAlt = this.visitDecisionState(p);
        }

        var transition = p.transition(predictedAlt - 1);
        switch (transition.getSerializationType()) {
            case Transition.EPSILON:
                if (p.getStateType() === ATNState.STAR_LOOP_ENTRY &&
                    /**  @type {StarLoopEntryState} */ (p).isPrecedenceDecision &&
                    !(transition.target instanceof LoopEndState)) {
                    // We are at the start of a left recursive rule's (...)* loop
                    // and we're not taking the exit branch of loop.
                    var peek = this._parentContextStack[this._parentContextStack.length - 1];
                    var localctx =
                        this.createInterpreterRuleContext(peek.a,
                                                            peek.b,
                                                            this._ctx.getRuleIndex());
                    this.pushNewRecursionContext(localctx,
                                                    this.atn.ruleToStartState[p.ruleIndex].stateNumber,
                                                    this._ctx.getRuleIndex());
                }
                break;

            case Transition.ATOM:
                this.match(/** @type {org.antlr.v4.runtime.atn.AtomTransition} */ (transition).tlabel);
                break;

            case Transition.RANGE:
            case Transition.SET:
            case Transition.NOT_SET:
                if (!transition.matches(this._input.LA(1), Token.MIN_USER_TOKEN_TYPE, 65535)) {
                    this.recoverInline();
                }
                this.matchWildcard();
                break;

            case Transition.WILDCARD:
                this.matchWildcard();
                break;

            case Transition.RULE:
                var ruleStartState = /** @type {RuleStartState} */ (transition.target);
                var ruleIndex = ruleStartState.ruleIndex;
                var newctx = this.createInterpreterRuleContext(this._ctx, p.stateNumber, ruleIndex);
                if (ruleStartState.isLeftRecursiveRule) {
                    var t = /** @type {RuleTransition} */ (transition);
                    this.enterRecursionRule(newctx, ruleStartState.stateNumber, ruleIndex, t.precedence);
                }
                else {
                    this.enterRule(newctx, transition.target.stateNumber, ruleIndex);
                }
                break;

            case Transition.PREDICATE:
                var predicateTransition = /** @type {PredicateTransition} */ (transition);
                if (!this.sempred(this._ctx, predicateTransition.ruleIndex, predicateTransition.predIndex)) {
                    throw new FailedPredicateException(this);
                }

                break;

            case Transition.ACTION:
                var actionTransition = /** @type {ActionTransition} */ (transition);
                this.action(this._ctx, actionTransition.ruleIndex, actionTransition.actionIndex);
                break;

            case Transition.PRECEDENCE:
                var ppt = /** @type {PrecedencePredicateTransition} */ (transition);
                if (!this.precpred(this._ctx, ppt.precedence)) {
                    throw new FailedPredicateException(this, format("precpred(_ctx, %d)", ppt.precedence));
                }
                break;

            default:
                throw new Error("Unrecognized ATN transition type.");
        }

        this.setState(transition.target.stateNumber);
    }

    /**
     * Method visitDecisionState() is called when the interpreter reaches
     * a decision state (instance of DecisionState). It gives an opportunity
     * for subclasses to track interesting things.
     *
     * @param {DecisionState} p
     * @return {number}
     */
    visitDecisionState(p) {
        var predictedAlt = 1;
        if (p.getNumberOfTransitions() > 1) {
            this.getErrorHandler().sync(this);
            var decision = p.decision;
            if (decision === this.overrideDecision && this._input.index() === this.overrideDecisionInputIndex && !this.overrideDecisionReached)
            {
                predictedAlt = this.overrideDecisionAlt;
                this.overrideDecisionReached = true;
            }
            else {
                predictedAlt = this.getInterpreter().adaptivePredict(this._input, decision, this._ctx);
            }
        }
        return predictedAlt;
    }

    /**
     * Provide simple "factory" for InterpreterRuleContext's.
     * @since 4.5.1
     * @protected
     *
     * @param {org.antlr.v4.runtime.ParserRuleContext} parent
     * @param {number} invokingStateNumber
     * @param {number} ruleIndex
     * @return {InterpreterRuleContext}
     */
    createInterpreterRuleContext(parent, invokingStateNumber, ruleIndex) {
        return new InterpreterRuleContext(parent, invokingStateNumber, ruleIndex);
    }

    /**
     * @protected
     * @param {ATNState} p
     * @return {void}
     */
    visitRuleStopState(p) {
        var ruleStartState = this.atn.ruleToStartState[p.ruleIndex];
        if (ruleStartState.isLeftRecursiveRule) {
            /**
             * @type {Pair<org.antlr.v4.runtime.ParserRuleContext, number>}
             */
            var parentContext = this._parentContextStack.pop();
            this.unrollRecursionContexts(parentContext.a);
            this.setState(parentContext.b);
        }
        else {
            this.exitRule();
        }
        var ruleTransition = /** @type {RuleTransition} */ (this.atn.states[this.getState()].transition(0));
        this.setState(ruleTransition.followState.stateNumber);
    }

    /**
     * Override this parser interpreters normal decision-making process
     * at a particular decision and input token index. Instead of
     * allowing the adaptive prediction mechanism to choose the
     * first alternative within a block that leads to a successful parse,
     * force it to take the alternative, 1..n for n alternatives.
     *
     * As an implementation limitation right now, you can only specify one
     * override. This is sufficient to allow construction of different
     * parse trees for ambiguous input. It means re-parsing the entire input
     * in general because you're never sure where an ambiguous sequence would
     * live in the various parse trees. For example, in one interpretation,
     * an ambiguous input sequence would be matched completely in expression
     * but in another it could match all the way back to the root.
     *
     * s : e '!'? ;
     * e : ID
     *   | ID '!'
     *   ;
     *
     * Here, x! can be matched as (s (e ID) !) or (s (e ID !)). In the first
     * case, the ambiguous sequence is fully contained only by the root.
     * In the second case, the ambiguous sequences fully contained within just
     * e, as in: (e ID !).
     *
     * Rather than trying to optimize this and make
     * some intelligent decisions for optimization purposes, I settled on
     * just re-parsing the whole input and then using
     * {link Trees#getRootOfSubtreeEnclosingRegion} to find the minimal
     * subtree that contains the ambiguous sequence. I originally tried to
     * record the call stack at the point the parser detected and ambiguity but
     * left recursive rules create a parse tree stack that does not reflect
     * the actual call stack. That impedance mismatch was enough to make
     * it it challenging to restart the parser at a deeply nested rule
     * invocation.
     *
     * Only parser interpreters can override decisions so as to avoid inserting
     * override checking code in the critical ALL(*) prediction execution path.
     *
     * @since 4.5.1
     *
     * @param {number} decision
     * @param {number} tokenIndex
     * @param {number} forcedAlt
     * @return {void}
     */
    addDecisionOverride(decision, tokenIndex, forcedAlt) {
        this.overrideDecision = decision;
        this.overrideDecisionInputIndex = tokenIndex;
        this.overrideDecisionAlt = forcedAlt;
    }

    /**
     * @return {InterpreterRuleContext}
     */
    getOverrideDecisionRoot() {
        return this.overrideDecisionRoot;
    }

    /**
     * Rely on the error handler for this parser but, if no tokens are consumed
     * to recover, add an error node. Otherwise, nothing is seen in the parse
     * tree.
     *
     * @protected
     *
     * @param {org.antlr.v4.runtime.RecognitionException} e
     * @return {void}
     */
    recover(e) {
        var i = this._input.index();
        this.getErrorHandler().recover(this, e);
        if (this._input.index() === i) {
            var tok = e.getOffendingToken();
            var expectedTokenType = Token.INVALID_TYPE;
            if (e instanceof InputMismatchException && !e.getExpectedTokens().isNil()) {
                expectedTokenType = e.getExpectedTokens().getMinElement(); // get any element
            }
            /**
             * @type {!Pair<org.antlr.v4.runtime.TokenSource, org.antlr.v4.runtime.CharStream>}
             */
            var pair = new Pair(tok.getTokenSource(), tok.getTokenSource().getInputStream());
            var errToken = this.getTokenFactory().create(pair,
                                            expectedTokenType,
                                            tok.getText(),
                                            Token.DEFAULT_CHANNEL,
                                            -1,
                                            -1, // invalid start/stop
                                            tok.getLine(),
                                            tok.getCharPositionInLine());
            this._ctx.addErrorNode(this.createErrorNode(this._ctx, errToken));
        }
    }

    /**
     * @protected
     * @return {org.antlr.v4.runtime.Token}
     */
    recoverInline() {
        return this._errHandler.recoverInline(this);
    }

    /**
     * Return the root of the parse, which can be useful if the parser
     * bails out. You still can access the top node. Note that,
     * because of the way left recursive rules add children, it's possible
     * that the root will not have any children if the start rule immediately
     * called and left recursive rule that fails.
     *
     * @since 4.5.1
     *
     * @return {InterpreterRuleContext}
     */
    getRootContext() {
        return this.rootContext;
    }
};


exports = ParserInterpreter;
