/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.DefaultErrorStrategy');
goog.module.declareLegacyNamespace();


const ANTLRErrorStrategy = goog.require('org.antlr.v4.runtime.ANTLRErrorStrategy');
const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');
const Token = goog.require('org.antlr.v4.runtime.Token');
const IntervalSet = goog.require('org.antlr.v4.runtime.misc.IntervalSet');
const NoViableAltException = goog.require('org.antlr.v4.runtime.NoViableAltException');
const InputMismatchException = goog.require('org.antlr.v4.runtime.InputMismatchException');
const FailedPredicateException = goog.require('org.antlr.v4.runtime.FailedPredicateException');
const Pair = goog.require('org.antlr.v4.runtime.misc.Pair');

/**
 * This is the default implementation of {@link ANTLRErrorStrategy} used for
 * error reporting and recovery in ANTLR parsers.
 *
 * @implements {ANTLRErrorStrategy}
 */
class DefaultErrorStrategy {
    constructor() {
        /**
         * Indicates whether the error strategy is currently "recovering from an
         * error". This is used to suppress reporting multiple error messages while
         * attempting to recover from a detected syntax error.
         *
         * @see #inErrorRecoveryMode
         * @private
         * @type {boolean}
         */
        this.errorRecoveryMode = false;

        /**
         * The index into the input stream where the last error occurred.
         * 	This is used to prevent infinite loops where an error is found
         *  but no token is consumed during recovery...another error is found,
         *  ad nauseum.  This is a failsafe mechanism to guarantee that at least
         *  one token/tree node is consumed for two errors.
         *
         * @private
         * @type {number}
         */
        this.lastErrorIndex = -1;

        /**
         * @private
         * @type {?org.antlr.v4.runtime.misc.IntervalSet}
         */
        this.lastErrorStates = null;

        /**
         * This field is used to propagate information about the lookahead following
         * the previous match. Since prediction prefers completing the current rule
         * to error recovery efforts, error reporting may occur later than the
         * original point where it was discoverable. The original context is used to
         * compute the true expected sets as though the reporting occurred as early
         * as possible.
         * @private
         * @type {?org.antlr.v4.runtime.ParserRuleContext}
         */
        this.nextTokensContext = null;

        /**
         * @private
         * @type {number}
         */
        this.nextTokensState = 0;
    }


    /**
     * @param {string} s
     * @return {string}
     */
    escapeWSAndQuote(s) {
        s = s.replace("\n","\\n");
        s = s.replace("\r","\\r");
        s = s.replace("\t","\\t");
        return "'"+s+"'";
    }

    /**
     * @param {Token} symbol
     * @return {?string}
     */
    getSymbolText(symbol) {
        return symbol.getText();
    }

    /**
     * @param {Token} symbol
     * @return {number}
     */
    getSymbolType(symbol) {
        return symbol.getType();
    }

    /** How should a token be displayed in an error message? The default
     *  is to display just the text, but during development you might
     *  want to have a lot of information spit out.  Override in that case
     *  to use t.toString() (which, for CommonToken, dumps everything about
     *  the token). This is better than forcing you to override a method in
     *  your token objects because you don't have to go modify your lexer
     *  so that it creates a new Java type.
     *
     * @param {Token} t
     * @return {string}
     */
    getTokenErrorDisplay(t) {
        if (t === null) return "<no token>";
        let s = this.getSymbolText(t);
        if (s === null) {
            if (this.getSymbolType(t) === Token.EOF ) {
                s = "<EOF>";
            }
            else {
                s = "<"+this.getSymbolType(t)+">";
            }
        }
        return this.escapeWSAndQuote(s);
    }

    /**
     *  Compute the error recovery set for the current rule.  During
     *  rule invocation, the parser pushes the set of tokens that can
     *  follow that rule reference on the stack; this amounts to
     *  computing FIRST of what follows the rule reference in the
     *  enclosing rule. See LinearApproximator.FIRST().
     *  This local follow set only includes tokens
     *  from within the rule; i.e., the FIRST computation done by
     *  ANTLR stops at the end of a rule.
     *
     *  EXAMPLE
     *
     *  When you find a "no viable alt exception", the input is not
     *  consistent with any of the alternatives for rule r.  The best
     *  thing to do is to consume tokens until you see something that
     *  can legally follow a call to r *or* any rule that called r.
     *  You don't want the exact set of viable next tokens because the
     *  input might just be missing a token--you might consume the
     *  rest of the input looking for one of the missing tokens.
     *
     *  Consider grammar:
     *
     *  a : '[' b ']'
     *    | '(' b ')'
     *    ;
     *  b : c '^' INT ;
     *  c : ID
     *    | INT
     *    ;
     *
     *  At each rule invocation, the set of tokens that could follow
     *  that rule is pushed on a stack.  Here are the various
     *  context-sensitive follow sets:
     *
     *  FOLLOW(b1_in_a) = FIRST(']') = ']'
     *  FOLLOW(b2_in_a) = FIRST(')') = ')'
     *  FOLLOW(c_in_b) = FIRST('^') = '^'
     *
     *  Upon erroneous input "[]", the call chain is
     *
     *  a -> b -> c
     *
     *  and, hence, the follow context stack is:
     *
     *  depth     follow set       start of rule execution
     *    0         <EOF>                    a (from main())
     *    1          ']'                     b
     *    2          '^'                     c
     *
     *  Notice that ')' is not included, because b would have to have
     *  been called from a different context in rule a for ')' to be
     *  included.
     *
     *  For error recovery, we cannot consider FOLLOW(c)
     *  (context-sensitive or otherwise).  We need the combined set of
     *  all context-sensitive FOLLOW sets--the set of all tokens that
     *  could follow any reference in the call chain.  We need to
     *  resync to one of those tokens.  Note that FOLLOW(c)='^' and if
     *  we resync'd to that token, we'd consume until EOF.  We need to
     *  sync to context-sensitive FOLLOWs for a, b, and c: {']','^'}.
     *  In this case, for input "[]", LA(1) is ']' and in the set, so we would
     *  not consume anything. After printing an error, rule c would
     *  return normally.  Rule b would not find the required '^' though.
     *  At this point, it gets a mismatched token error and throws an
     *  exception (since LA(1) is not in the viable following token
     *  set).  The rule exception handler tries to recover, but finds
     *  the same recovery set and doesn't consume anything.  Rule b
     *  exits normally returning to rule a.  Now it finds the ']' (and
     *  with the successful match exits errorRecovery mode).
     *
     *  So, you can see that the parser walks up the call chain looking
     *  for the token that was a member of the recovery set.
     *
     *  Errors are not generated in errorRecovery mode.
     *
     *  ANTLR's error recovery mechanism is based upon original ideas:
     *
     *  "Algorithms + Data Structures = Programs" by Niklaus Wirth
     *
     *  and
     *
     *  "A note on error recovery in recursive descent parsers":
     *  http://portal.acm.org/citation.cfm?id=947902.947905
     *
     *  Later, Josef Grosch had some good ideas:
     *
     *  "Efficient and Comfortable Error Recovery in Recursive Descent
     *  Parsers":
     *  ftp://www.cocolab.com/products/cocktail/doca4.ps/ell.ps.zip
     *
     *  Like Grosch I implement context-sensitive FOLLOW sets that are combined
     *  at run-time upon error to avoid overhead during parsing.
     *
     * @param {org.antlr.v4.runtime.Parser} recognizer
     * @return {org.antlr.v4.runtime.misc.IntervalSet}
     */
    getErrorRecoverySet(recognizer) {
        /**
         * @type {org.antlr.v4.runtime.atn.ATN}
         */
        let atn = recognizer.getInterpreter().atn;
        let ctx = recognizer.getContext();
        let recoverSet = new IntervalSet();
        while (ctx !== null && ctx.invokingState >= 0) {
            // compute what follows who invoked us
            let invokingState = atn.states[ctx.invokingState];
            let rt = /** @type {org.antlr.v4.runtime.atn.RuleTransition} */ (invokingState.transition(0));
            /**
             * @type {org.antlr.v4.runtime.misc.IntervalSet}
             */
            let follow = atn.nextTokens(rt.followState);
            recoverSet.addAll(follow);
            ctx = ctx.parent;
        }
        recoverSet.remove(Token.EPSILON);
        return recoverSet;
    }

    /**
     * Consume tokens until one matches the given token set.
     *
     * @param {org.antlr.v4.runtime.Parser} recognizer
     * @param {org.antlr.v4.runtime.misc.IntervalSet} set
     */
    consumeUntil(recognizer, set) {
        /**
         * @type {number}
         */
        let ttype = recognizer.getInputStream().LA(1);
        while (ttype !== Token.EOF && !set.contains(ttype)) {
            recognizer.consume();
            ttype = recognizer.getInputStream().LA(1);
        }
    }

    /**
     *  Conjure up a missing token during error recovery.
     *
     *  The recognizer attempts to recover from single missing
     *  symbols. But, actions might refer to that missing symbol.
     *  For example, x=ID {f($x);}. The action clearly assumes
     *  that there has been an identifier matched previously and that
     *  $x points at that token. If that token is missing, but
     *  the next token in the stream is what we want we assume that
     *  this token is missing and we keep going. Because we
     *  have to return some token to replace the missing token,
     *  we have to conjure one up. This method gives the user control
     *  over the tokens returned for missing tokens. Mostly,
     *  you will want to create something special for identifier
     *  tokens. For literals such as '{' and ',', the default
     *  action in the parser or tree parser works. It simply creates
     *  a CommonToken of the appropriate type. The text will be the token.
     *  If you change what tokens must be created by the lexer,
     *  override this method to create the appropriate tokens.
     *
     * @param {org.antlr.v4.runtime.Parser} recognizer
     * @return {Token}
     */
    getMissingSymbol(recognizer) {
        let current = recognizer.getCurrentToken();
        let expecting = recognizer.getExpectedTokens();
        let expectedTokenType = Token.INVALID_TYPE;
        if (!expecting.isNil()) {
            expectedTokenType = expecting.getMinElement(); // get any element
        }
        let tokenText = "";
        if (expectedTokenType === Token.EOF ) {
            tokenText = "<missing EOF>";
        } else {
            tokenText = "<missing "+recognizer.getVocabulary().getDisplayName(expectedTokenType)+">";
        }
        let lookback = recognizer.getInputStream().LT(-1);
        if (current.getType() === Token.EOF && lookback !== null) {
            current = lookback;
        }
        /**
         * @type {!Pair<org.antlr.v4.runtime.TokenSource, org.antlr.v4.runtime.CharStream>}
         */
        let p = new Pair(current.getTokenSource(), current.getTokenSource().getInputStream());
        return recognizer.getTokenFactory().create(p, expectedTokenType, tokenText,
                            Token.DEFAULT_CHANNEL,
                            -1, -1,
                            current.getLine(), current.getCharPositionInLine());
    }

    /**
     * @param {?org.antlr.v4.runtime.Parser} recognizer
     * @protected
     */
    endErrorCondition(recognizer) {
        this.errorRecoveryMode = false;
        this.lastErrorStates = null;
        this.lastErrorIndex = -1;
    }

    /**
     * @param {?org.antlr.v4.runtime.Parser} recognizer
     * @protected
     */
    beginErrorCondition(recognizer) {
        this.errorRecoveryMode = true;
    }

    /**
     * This method implements the single-token deletion inline error recovery
     * strategy. It is called by {@link #recoverInline} to attempt to recover
     * from mismatched input. If this method returns null, the parser and error
     * handler state will not have changed. If this method returns non-null,
     * {@code recognizer} will <em>not</em> be in error recovery mode since the
     * returned token was a successful match.
     *
     * <p>If the single-token deletion is successful, this method calls
     * {@link #reportUnwantedToken} to report the error, followed by
     * {@link Parser#consume} to actually "delete" the extraneous token. Then,
     * before returning {@link #reportMatch} is called to signal a successful
     * match.</p>
     *
     * @protected
     * @param {org.antlr.v4.runtime.Parser} recognizer the parser instance
     * @return {Token} the successfully matched {@link Token} instance if single-token
     * deletion successfully recovers from the mismatched input, otherwise
     * {@code null}
     */
    singleTokenDeletion(recognizer) {
        let nextTokenType = recognizer.getInputStream().LA(2);
        let expecting = recognizer.getExpectedTokens();
        if (expecting.contains(nextTokenType)) {
            this.reportUnwantedToken(recognizer);
            recognizer.consume(); // simply delete extra token
            // we want to return the token we're actually matching
            let matchedSymbol = recognizer.getCurrentToken();
            this.reportMatch(recognizer);  // we know current token is correct
            return matchedSymbol;
        }
        return null;
    }

    /**
     * This is called by {@link #reportError} when the exception is a
     * {@link NoViableAltException}.
     *
     * @see #reportError
     *
     * @param {org.antlr.v4.runtime.Parser} recognizer the parser instance
     * @param {NoViableAltException} e the recognition exception
     * @protected
     */
    reportNoViableAlternative(recognizer, e) {
        let tokens = recognizer.getInputStream();
        let input = "";
        if (tokens !== null) {
            if (e.getStartToken().getType() === Token.EOF) {
                input = "<EOF>";
            }
            else {
                input = tokens.getText(e.getStartToken(), e.getOffendingToken());
            }
        }
        else {
            input = "<unknown input>";
        }
        let msg = "no viable alternative at input " + this.escapeWSAndQuote(input);
        recognizer.notifyErrorListeners(e.getOffendingToken(), msg, e);
    }

    /**
     * This is called by {@link #reportError} when the exception is an
     * {@link InputMismatchException}.
     *
     * @see #reportError
     * @param {org.antlr.v4.runtime.Parser} recognizer the parser instance
     * @param {InputMismatchException} e the recognition exception
     * @protected
     */
    reportInputMismatch(recognizer, e) {
        let msg = "mismatched input " +
            this.getTokenErrorDisplay(e.getOffendingToken()) +
            " expecting " +
            e.getExpectedTokens().toStringWithVocabulary(recognizer.getVocabulary());
        recognizer.notifyErrorListeners(e.getOffendingToken(), msg, e);
    }

    /**
     * This is called by {@link #reportError} when the exception is a
     * {@link FailedPredicateException}.
     *
     * @see #reportError
     *
     * @param {org.antlr.v4.runtime.Parser} recognizer the parser instance
     * @param {FailedPredicateException} e the recognition exception
     * @protected
     */
    reportFailedPredicate(recognizer, e) {
        let ruleName = recognizer.getRuleNames()[recognizer.getContext().getRuleIndex()];
        let msg = "rule " + ruleName + " " + e.message;
        recognizer.notifyErrorListeners(e.getOffendingToken(), msg, e);
    }

    /**
     * This method is called to report a syntax error which requires the removal
     * of a token from the input stream. At the time this method is called, the
     * erroneous symbol is current {@code LT(1)} symbol and has not yet been
     * removed from the input stream. When this method returns,
     * {@code recognizer} is in error recovery mode.
     *
     * <p>This method is called when {@link #singleTokenDeletion} identifies
     * single-token deletion as a viable recovery strategy for a mismatched
     * input error.</p>
     *
     * <p>The default implementation simply returns if the handler is already in
     * error recovery mode. Otherwise, it calls {@link #beginErrorCondition} to
     * enter error recovery mode, followed by calling
     * {@link Parser#notifyErrorListeners}.</p>
     *
     * @param {org.antlr.v4.runtime.Parser} recognizer the parser instance
     * @protected
     */
    reportUnwantedToken(recognizer) {
        if (this.inErrorRecoveryMode(recognizer)) {
            return;
        }
        this.beginErrorCondition(recognizer);
        let t = recognizer.getCurrentToken();
        let tokenName = this.getTokenErrorDisplay(t);
        let expecting = recognizer.getExpectedTokens();
        let msg = "extraneous input " + tokenName + " expecting " +
            expecting.toStringWithVocabulary(recognizer.getVocabulary());
        recognizer.notifyErrorListeners(t, msg, null);
    }

    /**
     * This method is called to report a syntax error which requires the
     * insertion of a missing token into the input stream. At the time this
     * method is called, the missing token has not yet been inserted. When this
     * method returns, {@code recognizer} is in error recovery mode.
     *
     * <p>This method is called when {@link #singleTokenInsertion} identifies
     * single-token insertion as a viable recovery strategy for a mismatched
     * input error.</p>
     *
     * <p>The default implementation simply returns if the handler is already in
     * error recovery mode. Otherwise, it calls {@link #beginErrorCondition} to
     * enter error recovery mode, followed by calling
     * {@link Parser#notifyErrorListeners}.</p>
     *
     * @param {org.antlr.v4.runtime.Parser} recognizer the parser instance
     * @protected
     */
    reportMissingToken(recognizer) {
        if (this.inErrorRecoveryMode(recognizer)) {
            return;
        }
        this.beginErrorCondition(recognizer);
        let t = recognizer.getCurrentToken();
        let expecting = recognizer.getExpectedTokens();
        let msg = "missing " + expecting.toStringWithVocabulary(recognizer.getVocabulary()) +
            " at " + this.getTokenErrorDisplay(t);
        recognizer.notifyErrorListeners(t, msg, null);
    }

    /**
     * This method implements the single-token insertion inline error recovery
     * strategy. It is called by {@link #recoverInline} if the single-token
     * deletion strategy fails to recover from the mismatched input. If this
     * method returns {@code true}, {@code recognizer} will be in error recovery
     * mode.
     *
     * <p>This method determines whether or not single-token insertion is viable by
     * checking if the {@code LA(1)} input symbol could be successfully matched
     * if it were instead the {@code LA(2)} symbol. If this method returns
     * {@code true}, the caller is responsible for creating and inserting a
     * token with the correct type to produce this behavior.</p>
     *
     * @param {org.antlr.v4.runtime.Parser} recognizer the parser instance
     * @return {boolean} {@code true} if single-token insertion is a viable recovery
     * strategy for the current mismatched input, otherwise {@code false}
     * @protected
     */
    singleTokenInsertion(recognizer) {
        let currentSymbolType = recognizer.getInputStream().LA(1);
        // if current token is consistent with what could come after current
        // ATN state, then we know we're missing a token; error recovery
        // is free to conjure up and insert the missing token
        /**
         * @type {org.antlr.v4.runtime.atn.ATNState}
         */
        let currentState = recognizer.getInterpreter().atn.states[recognizer.getState()];
        /**
         * @type {org.antlr.v4.runtime.atn.ATNState}
         */
        let next = currentState.transition(0).target;
        /**
         * @type {org.antlr.v4.runtime.atn.ATN}
         */
        let atn = recognizer.getInterpreter().atn;
        /**
         * @type {org.antlr.v4.runtime.misc.IntervalSet}
         */
        let expectingAtLL2 = atn.nextTokens(next, recognizer.getContext());
        if (expectingAtLL2.contains(currentSymbolType)) {
            this.reportMissingToken(recognizer);
            return true;
        }
        return false;
    }

    /**
     * <p>The default implementation simply calls {@link #endErrorCondition} to
     * ensure that the handler is not in error recovery mode.</p>
     */
    reset(recognizer) {
        this.endErrorCondition(recognizer);
    }

    inErrorRecoveryMode(recognizer) {
        return this.errorRecoveryMode;
    }

    /**
     * <p>The default implementation simply calls {@link #endErrorCondition}.</p>
     */
    reportMatch(recognizer) {
        this.endErrorCondition(recognizer);
    }

    reportError(recognizer, e) {
        // if we've already reported an error and have not matched a token
        // yet successfully, don't report any errors.
        if (this.inErrorRecoveryMode(recognizer)) {
            return; // don't report spurious errors
        }
        this.beginErrorCondition(recognizer);
        if (e instanceof NoViableAltException) {
            this.reportNoViableAlternative(recognizer, e);
        }
        else if (e instanceof InputMismatchException) {
            this.reportInputMismatch(recognizer, e);
        }
        else if (e instanceof FailedPredicateException) {
            this.reportFailedPredicate(recognizer, e);
        }
        else {
            console.error("unknown recognition error type: " + e.constructor.name);
            recognizer.notifyErrorListeners(e.getOffendingToken(), e.message, e);
        }
    }

    recover(recognizer, e) {
        if (this.lastErrorIndex === recognizer.getInputStream().index() &&
            this.lastErrorStates != null &&
            this.lastErrorStates.contains(recognizer.getState())) {
            // uh oh, another error at same token index and previously-visited
            // state in ATN; must be a case where LT(1) is in the recovery
            // token set so nothing got consumed. Consume a single token
            // at least to prevent an infinite loop; this is a failsafe.
            //			System.err.println("seen error condition before index="+
            //							   lastErrorIndex+", states="+lastErrorStates);
            //			System.err.println("FAILSAFE consumes "+recognizer.getTokenNames()[recognizer.getInputStream().LA(1)]);
            recognizer.consume();
        }
        this.lastErrorIndex = recognizer.getInputStream().index();
        if (this.lastErrorStates === null) {
            this.lastErrorStates = new IntervalSet();
        }
        this.lastErrorStates.add(recognizer.getState());
        let followSet = this.getErrorRecoverySet(recognizer);
        this.consumeUntil(recognizer, followSet);
    }

    sync(recognizer) {
        /**
         * @type {org.antlr.v4.runtime.atn.ATNState}
         */
        let s = recognizer.getInterpreter().atn.states[recognizer.getState()];
        // If already recovering, don't try to sync
        if (this.inErrorRecoveryMode(recognizer)) {
            return;
        }

        let tokens = /** @type {org.antlr.v4.runtime.TokenStream} */ (recognizer.getInputStream());
        let la = tokens.LA(1);

        // try cheaper subset first; might get lucky. seems to shave a wee bit off
        /**
         * @type {org.antlr.v4.runtime.misc.IntervalSet}
         */
        let nextTokens = recognizer.getATN().nextTokens(s);
        if (nextTokens.contains(la)) {
            // We are sure the token matches
            this.nextTokensContext = null;
            this.nextTokensState = ATNState.INVALID_STATE_NUMBER;
            return;
        }

        if (nextTokens.contains(Token.EPSILON)) {
            if (this.nextTokensContext === null) {
                // It's possible the next token won't match; information tracked
                // by sync is restricted for performance.
                this.nextTokensContext = recognizer.getContext();
                this.nextTokensState = recognizer.getState();
            }
            return;
        }

        switch (s.getStateType()) {
            case ATNState.BLOCK_START:
            case ATNState.STAR_BLOCK_START:
            case ATNState.PLUS_BLOCK_START:
            case ATNState.STAR_LOOP_ENTRY:
                // report error and recover if possible
                if (this.singleTokenDeletion(recognizer) !== null) {
                    return;
                }
                throw new InputMismatchException(recognizer);
            case ATNState.PLUS_LOOP_BACK:
            case ATNState.STAR_LOOP_BACK:
                this.reportUnwantedToken(recognizer);
                let expecting = /** @type {org.antlr.v4.runtime.misc.IntervalSet} */ (recognizer.getExpectedTokens());
                let whatFollowsLoopIterationOrRule = /** @type {org.antlr.v4.runtime.misc.IntervalSet} */ (expecting.or(this.getErrorRecoverySet(recognizer)));
                this.consumeUntil(recognizer, whatFollowsLoopIterationOrRule);
                break;
            default:
                // do nothing if we can't identify the exact kind of ATN state
                break;
        }
    }

    recoverInline(recognizer) {
        // SINGLE TOKEN DELETION
        let matchedSymbol = this.singleTokenDeletion(recognizer);
        if (matchedSymbol !== null) {
            // we have deleted the extra token.
            // now, move past ttype token as if all were ok
            recognizer.consume();
            return matchedSymbol;
        }

        // SINGLE TOKEN INSERTION
        if (this.singleTokenInsertion(recognizer)) {
            return this.getMissingSymbol(recognizer);
        }

        /**
         * @type {Error}
         */
        var e;
        // even that didn't work; must throw the exception
        if (this.nextTokensContext === null) {
            e = new InputMismatchException(recognizer);
        } else {
            e = new InputMismatchException(recognizer, this.nextTokensState, this.nextTokensContext);
        }
        throw e;
    }
};


exports = DefaultErrorStrategy;
