/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LexerATNSimulator');


const LexerActionExecutor = goog.require('org.antlr.v4.runtime.atn.LexerActionExecutor');
const PredictionContext = goog.require('org.antlr.v4.runtime.atn.PredictionContext');
const SingletonPredictionContext = goog.require('org.antlr.v4.runtime.atn.SingletonPredictionContext');
const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');
const ATN = goog.require('org.antlr.v4.runtime.atn.ATN');
const LexerATNConfig = goog.require('org.antlr.v4.runtime.atn.LexerATNConfig');
const RuleStopState = goog.require('org.antlr.v4.runtime.atn.RuleStopState');
const ATNSimulator = goog.require('org.antlr.v4.runtime.atn.ATNSimulator');
const OrderedATNConfigSet = goog.require('org.antlr.v4.runtime.atn.OrderedATNConfigSet');
const DFA = goog.require('org.antlr.v4.runtime.dfa.DFA');
const DFAState = goog.require('org.antlr.v4.runtime.dfa.DFAState');
const Token = goog.require('org.antlr.v4.runtime.Token');
const Lexer = goog.require('org.antlr.v4.runtime.Lexer');
const IntStream = goog.require('org.antlr.v4.runtime.IntStream');
const CharStream = goog.require('org.antlr.v4.runtime.CharStream');
const LexerNoViableAltException = goog.require('org.antlr.v4.runtime.LexerNoViableAltException');
const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');
const {format} = goog.require('goog.string');
const {assert} = goog.require('goog.asserts');

/** When we hit an accept state in either the DFA or the ATN, we
 *  have to notify the character stream to start buffering characters
 *  via {@link IntStream#mark} and record the current state. The current sim state
 *  includes the current index into the input, the current line,
 *  and current character position in that line. Note that the Lexer is
 *  tracking the starting line and characterization of the token. These
 *  variables track the "state" of the simulator when it hits an accept state.
 *
 *  <p>We track these variables separately for the DFA and ATN simulation
 *  because the DFA simulation often has to fail over to the ATN
 *  simulation. If the ATN simulation fails, we need the DFA to fall
 *  back to its previously accepted state, if any. If the ATN succeeds,
 *  then the ATN does the accept and the DFA simulator that invoked it
 *  can simply return the predicted token type.</p>
 */
class SimState {
    constructor() {
        /**
         * @protected {number}
         */
        this.index = -1;
        /**
         * @protected {number}
         */
        this.line = 0;
        /**
         * @protected {number}
         */
        this.charPos = -1;
        /**
         * @protected {DFAState}
         */
        this.dfaState = null;
    }

    /**
     * @protected
     * @return {void}
     */
    reset() {
        this.index = -1;
        this.line = 0;
        this.charPos = -1;
        this.dfaState = null;
    }
}

/**
 * "dup" of ParserInterpreter
 */
class LexerATNSimulator extends ATNSimulator {
    /**
     * @param {Lexer} recog
     * @param {org.antlr.v4.runtime.atn.ATN} atn
     * @param {Array<org.antlr.v4.runtime.dfa.DFA>} decisionToDFA
     * @param {org.antlr.v4.runtime.atn.PredictionContextCache} sharedContextCache
     */
    constructor(recog, atn, decisionToDFA, sharedContextCache) {
        super(atn, sharedContextCache);
        /**
         * @protected {Lexer}
         */
        this.recog = recog;
        /**
         * The current token's starting index into the character stream.
         * Shared across DFA to ATN simulation in case the ATN fails and the
         * DFA did not have a previous accept state. In this case, we use the
         * ATN-generated exception object.
         *
         * @protected {number}
         */
        this.startIndex = -1;
        /**
         * line number 1..n within the input
         *
         * @protected {number}
         */
        this.line = 1;
        /**
         * The index of the character relative to the beginning of the line 0..n-1
         *
         * @protected {number}
         */
        this.charPositionInLine = 0;
        /**
         * @type {Array<org.antlr.v4.runtime.dfa.DFA>}
         */
        this.decisionToDFA = decisionToDFA;
        /**
         * @protected {number}
         */
        this.mode = Lexer.DEFAULT_MODE;
        /**
         * Used during DFA/ATN exec to record the most recent accept configuration info
         *
         * @protected {SimState}
         */
        this.prevAccept = new SimState();
    }

    /**
     * @param {LexerATNSimulator} simulator
     * @return {void}
     */
    copyState(simulator) {
        this.charPositionInLine = simulator.charPositionInLine;
        this.line = simulator.line;
        this.mode = simulator.mode;
        this.startIndex = simulator.startIndex;
    }

    /**
     * @param {!CharStream} input
     * @param {number} mode
     */
    match(input, mode) {
        LexerATNSimulator.match_calls++;
        this.mode = mode;
        var mark = input.mark();
        try {
            this.startIndex = input.index();
            this.prevAccept.reset();
            var dfa = this.decisionToDFA[mode];
            if (dfa.s0 == null) {
                return this.matchATN(input);
            }
            else {
                return this.execATN(input, dfa.s0);
            }
        }
        finally {
            input.release(mark);
        }
    }

    reset() {
        this.prevAccept.reset();
        this.startIndex = -1;
        this.line = 1;
        this.charPositionInLine = 0;
        this.mode = Lexer.DEFAULT_MODE;
    }

    clearDFA() {
        for (var d = 0; d < this.decisionToDFA.length; d++) {
            this.decisionToDFA[d] = new DFA(this.atn.getDecisionState(d), d);
        }
    }

    /**
     * @protected
     * @param {!CharStream} input
     * @return {number}
     */
    matchATN(input) {
        var startState = this.atn.modeToStartState[this.mode];

        if (LexerATNSimulator.debug) {
            console.log(format("matchATN mode %d start: %s\n", this.mode, startState.toString()));
        }

        var old_mode = this.mode;

        var s0_closure = this.computeStartState(input, startState);
        var suppressEdge = s0_closure.hasSemanticContext;
        s0_closure.hasSemanticContext = false;

        var next = this.addDFAState(s0_closure);
        if (!suppressEdge) {
            this.decisionToDFA[this.mode].s0 = next;
        }

        var predict = this.execATN(input, next);

        if (LexerATNSimulator.debug) {
            console.log(format("DFA after matchATN: %s\n", this.decisionToDFA[old_mode].toLexerString()));
        }

        return predict;
    }

    /**
     * @protected
     * @param {!CharStream} input
     * @param {DFAState} ds0
     * @return {number}
     */
    execATN(input, ds0) {
        //System.out.println("enter exec index "+input.index()+" from "+ds0.configs);
        if (LexerATNSimulator.debug) {
            console.log(format("start state closure=%s\n", ds0.configs.toString()));
        }

        if (ds0.isAcceptState) {
            // allow zero-length tokens
            this.captureSimState(this.prevAccept, input, ds0);
        }

        var t = input.LA(1);

        var s = ds0; // s is current/from DFA state

        while (true) { // while more work
            if (LexerATNSimulator.debug) {
                console.log(format("execATN loop starting closure: %s\n", s.configs.toString()));
            }

            // As we move src->trg, src->trg, we keep track of the previous trg to
            // avoid looking up the DFA state again, which is expensive.
            // If the previous target was already part of the DFA, we might
            // be able to avoid doing a reach operation upon t. If s!=null,
            // it means that semantic predicates didn't prevent us from
            // creating a DFA state. Once we know s!=null, we check to see if
            // the DFA state has an edge already for t. If so, we can just reuse
            // it's configuration set; there's no point in re-computing it.
            // This is kind of like doing DFA simulation within the ATN
            // simulation because DFA simulation is really just a way to avoid
            // computing reach/closure sets. Technically, once we know that
            // we have a previously added DFA state, we could jump over to
            // the DFA simulator. But, that would mean popping back and forth
            // a lot and making things more complicated algorithmically.
            // This optimization makes a lot of sense for loops within DFA.
            // A character will take us back to an existing DFA state
            // that already has lots of edges out of it. e.g., .* in comments.
            var target = this.getExistingTargetState(s, t);
            if (target == null) {
                target = this.computeTargetState(input, s, t);
            }

            if (target === ATNSimulator.ERROR) {
                break;
            }

            // If this is a consumable input element, make sure to consume before
            // capturing the accept state so the input index, line, and char
            // position accurately reflect the state of the interpreter at the
            // end of the token.
            if (t !== IntStream.EOF) {
                this.consume(input);
            }

            if (target.isAcceptState) {
                this.captureSimState(this.prevAccept, input, target);
                if (t === IntStream.EOF) {
                    break;
                }
            }

            t = input.LA(1);
            s = target; // flip; current DFA target becomes new src/from state
        }

        return this.failOrAccept(this.prevAccept, input, s.configs, t);
    }

    /**
     * Get an existing target state for an edge in the DFA. If the target state
     * for the edge has not yet been computed or is otherwise not available,
     * this method returns {@code null}.
     *
     * @protected
     * @param {DFAState} s The current DFA state
     * @param {number} t The next input symbol
     * @return {DFAState} The existing target DFA state for the given input symbol
     * {@code t}, or {@code null} if the target state for this edge is not
     * already cached
     */
    getExistingTargetState(s, t) {
        if (s.edges == null ||
            t < LexerATNSimulator.MIN_DFA_EDGE ||
            t > LexerATNSimulator.MAX_DFA_EDGE) {
            return null;
        }

        var target = s.edges[t - LexerATNSimulator.MIN_DFA_EDGE];
        if (LexerATNSimulator.debug && target != null) {
            console.log("reuse state " + s.stateNumber +
                               " edge to " + target.stateNumber);
        }

        return target;
    }

    /**
     * Compute a target state for an edge in the DFA, and attempt to add the
     * computed state and corresponding edge to the DFA.
     *
     * @param {!CharStream} input The input stream
     * @param {DFAState} s The current DFA state
     * @param {number} t The next input symbol
     *
     * @return {DFAState} The computed target
     * DFA state for the given input symbol
     * {@code t}. If {@code t} does not lead to a valid DFA state, this method
     * returns {@link #ERROR}.
     */
    computeTargetState(input, s, t) {
        var reach = new OrderedATNConfigSet();

        // if we don't find an existing DFA state
        // Fill reach starting from closure, following t transitions
        this.getReachableConfigSet(input, s.configs, reach, t);

        if (reach.isEmpty()) { // we got nowhere on t from s
            if (!reach.hasSemanticContext) {
                // we got nowhere on t, don't throw out this knowledge; it'd
                // cause a failover from DFA later.
                this.addDFAEdge(s, t, ATNSimulator.ERROR);
            }

            // stop when we can't match any more char
            return ATNSimulator.ERROR;
        }

        // Add an edge from s to target DFA found/created for reach
        return this.addDFAEdge(s, t, reach);
    }

    /**
     * @protected
     * @param {SimState} prevAccept
     * @param {!CharStream} input
     * @param {org.antlr.v4.runtime.atn.ATNConfigSet} reach
     * @param {number} t
     * @return {number}
     */
    failOrAccept(prevAccept, input, reach, t) {
		if (prevAccept.dfaState != null) {
			var lexerActionExecutor = prevAccept.dfaState.lexerActionExecutor;
			this.accept(input, lexerActionExecutor, this.startIndex,
				prevAccept.index, prevAccept.line, prevAccept.charPos);
			return prevAccept.dfaState.prediction;
		}
		else {
			// if no accept and EOF is first char, return EOF
			if (t === IntStream.EOF && input.index() === this.startIndex ) {
				return Token.EOF;
			}

			throw new LexerNoViableAltException(this.recog, input, this.startIndex, reach);
		}
    }

    /**
     * Given a starting configuration set, figure out all ATN configurations
     * we can reach upon input {@code t}. Parameter {@code reach} is a return
     * parameter.
     *
     * @protected
     * @param {!CharStream} input
     * @param {!org.antlr.v4.runtime.atn.ATNConfigSet} closure
     * @param {!org.antlr.v4.runtime.atn.ATNConfigSet} reach
     * @param {number} t
     * @return {void}
     */
    getReachableConfigSet(input, closure, reach, t) {
        // this is used to skip processing for configs which have a lower priority
        // than a config that already reached an accept state for the same rule
        var skipAlt = ATN.INVALID_ALT_NUMBER;
        for (const c of closure) {
            var currentAltReachedAcceptState = c.alt === skipAlt;
            if (currentAltReachedAcceptState && c.hasPassedThroughNonGreedyDecision()) {
                continue;
            }

            if (LexerATNSimulator.debug) {
                console.log(format("testing %s at %s\n", this.getTokenName(t), c.toString(this.recog, true)));
            }

            var n = c.state.getNumberOfTransitions();
            for (var ti = 0; ti < n; ti++) {               // for each transition
                var trans = c.state.transition(ti);
                var target = this.getReachableTarget(trans, t);
                if (target != null) {
                    var lexerActionExecutor = c.getLexerActionExecutor();
                    if (lexerActionExecutor != null) {
                        lexerActionExecutor = lexerActionExecutor.fixOffsetBeforeMatch(input.index() - this.startIndex);
                    }

                    var treatEofAsEpsilon = t === CharStream.EOF;
                    if (this.closure(input, new LexerATNConfig(c, target, lexerActionExecutor), reach, currentAltReachedAcceptState, true, treatEofAsEpsilon)) {
                        // any remaining configs for this alt have a lower priority than
                        // the one that just reached an accept state.
                        skipAlt = c.alt;
                        break;
                    }
                }
            }
        }
    }

    /**
     * @protected
     * @param {CharStream} input
     * @param {LexerActionExecutor} lexerActionExecutor
     * @param {number} startIndex
     * @param {number} index
     * @param {number} line
     * @param {number} charPos
     * @return {void}
     */
    accept(input, lexerActionExecutor, startIndex, index, line, charPos) {
		if (LexerATNSimulator.debug) {
			console.log(format("ACTION %s\n", lexerActionExecutor.toString()));
		}

		// seek to after last char in token
		input.seek(index);
		this.line = line;
		this.charPositionInLine = charPos;

		if (lexerActionExecutor != null && this.recog != null) {
			lexerActionExecutor.execute(this.recog, input, startIndex);
		}
    }

    /**
     * @protected
     * @param {Transition} trans
     * @param {number} t
     * @return {org.antlr.v4.runtime.atn.ATNState}
     */
    getReachableTarget(trans, t) {
        if (trans.matches(t, Lexer.MIN_CHAR_VALUE, Lexer.MAX_CHAR_VALUE)) {
            return trans.target;
        }
        return null;
    }

    /**
     * @protected
     * @param {CharStream} input
     * @param {org.antlr.v4.runtime.atn.ATNState} p
     * @return {org.antlr.v4.runtime.atn.ATNConfigSet}
     */
    computeStartState(input, p) {
		var initialContext = PredictionContext.EMPTY;
		var configs = new OrderedATNConfigSet();
		for (var i = 0; i < p.getNumberOfTransitions(); i++) {
			var target = p.transition(i).target;
			var c = new LexerATNConfig(target, i + 1, initialContext);
			this.closure(input, c, configs, false, false, false);
		}
		return configs;
    }

    /**
     * Since the alternatives within any lexer decision are ordered by
     * preference, this method stops pursuing the closure as soon as an accept
     * state is reached. After the first accept state is reached by depth-first
     * search from {@code config}, all other (potentially reachable) states for
     * this rule would have a lower priority.
     *
     * @protected
     * @param {CharStream} input
     * @param {LexerATNConfig} config
     * @param {org.antlr.v4.runtime.atn.ATNConfigSet} configs
     * @param {boolean} currentAltReachedAcceptState
     * @param {boolean} speculative
     * @param {boolean} treatEofAsEpsilon
     * @return {boolean} {@code true} if an accept state is reached, otherwise
     * {@code false}.
     */
    closure(input, config, configs, currentAltReachedAcceptState, speculative, treatEofAsEpsilon) {
        if (LexerATNSimulator.debug) {
            console.log("closure(" + config.toString() + ")");
        }

        if (config.state instanceof RuleStopState) {
            if (LexerATNSimulator.debug) {
                if (this.recog != null) {
                    console.log(format("closure at %s rule stop %s\n", this.recog.getRuleNames()[config.state.ruleIndex], config.toString()));
                }
                else {
                    console.log(format("closure at rule stop %s\n", config.toString()));
                }
            }

            if (config.context == null || config.context.hasEmptyPath()) {
                if (config.context == null || config.context.isEmpty()) {
                    configs.add(config);
                    return true;
                }
                else {
                    configs.add(new LexerATNConfig(config, config.state, PredictionContext.EMPTY));
                    currentAltReachedAcceptState = true;
                }
            }

            if (config.context != null && !config.context.isEmpty()) {
                for (var i = 0; i < config.context.size(); i++) {
                    if (config.context.getReturnState(i) !== PredictionContext.EMPTY_RETURN_STATE) {
                        var newContext = config.context.getParent(i); // "pop" return state
                        var returnState = this.atn.states[config.context.getReturnState(i)];
                        var c = new LexerATNConfig(config, returnState, newContext);
                        currentAltReachedAcceptState = this.closure(input, c, configs, currentAltReachedAcceptState, speculative, treatEofAsEpsilon);
                    }
                }
            }

            return currentAltReachedAcceptState;
        }

        // optimization
        if (!config.state.onlyHasEpsilonTransitions()) {
            if (!currentAltReachedAcceptState || !config.hasPassedThroughNonGreedyDecision()) {
                configs.add(config);
            }
        }

        var p = config.state;
        for (var i = 0; i < p.getNumberOfTransitions(); i++) {
            var t = p.transition(i);
            var c = this.getEpsilonTarget(input, config, t, configs, speculative, treatEofAsEpsilon);
            if (c != null) {
                currentAltReachedAcceptState = this.closure(input, c, configs, currentAltReachedAcceptState, speculative, treatEofAsEpsilon);
            }
        }

        return currentAltReachedAcceptState;
    }

    /**
     * side-effect: can alter configs.hasSemanticContext
     *
     * @protected
     * @param {CharStream} input
     * @param {LexerATNConfig} config
     * @param {Transition} t
     * @param {org.antlr.v4.runtime.atn.ATNConfigSet} configs
     * @param {boolean} speculative
     * @param {boolean} treatEofAsEpsilon
     * @return {LexerATNConfig}
     */
	getEpsilonTarget(input, config, t, configs, speculative, treatEofAsEpsilon) {
        /**
         * @type {LexerATNConfig}
         */
		var c = null;
		switch (t.getSerializationType()) {
			case Transition.RULE:
                var ruleTransition = /** @type {org.antlr.v4.runtime.atn.RuleTransition} */ (t);
				var newContext =
					SingletonPredictionContext.create(config.context, ruleTransition.followState.stateNumber);
				c = new LexerATNConfig(config, t.target, newContext);
				break;

			case Transition.PRECEDENCE:
				throw new Error("Precedence predicates are not supported in lexers.");

			case Transition.PREDICATE:
				/*  Track traversing semantic predicates. If we traverse,
				 we cannot add a DFA state for this "reach" computation
				 because the DFA would not test the predicate again in the
				 future. Rather than creating collections of semantic predicates
				 like v3 and testing them on prediction, v4 will test them on the
				 fly all the time using the ATN not the DFA. This is slower but
				 semantically it's not used that often. One of the key elements to
				 this predicate mechanism is not adding DFA states that see
				 predicates immediately afterwards in the ATN. For example,
				 a : ID {p1}? | ID {p2}? ;
				 should create the start state for rule 'a' (to save start state
				 competition), but should not create target of ID state. The
				 collection of ATN states the following ID references includes
				 states reached by traversing predicates. Since this is when we
				 test them, we cannot cash the DFA state target of ID.
			 */
                var pt = /** @type {org.antlr.v4.runtime.atn.PredicateTransition} */ (t);
				if (LexerATNSimulator.debug) {
					console.log("EVAL rule " + pt.ruleIndex + ":" + pt.predIndex);
				}
				configs.hasSemanticContext = true;
				if (this.evaluatePredicate(input, pt.ruleIndex, pt.predIndex, speculative)) {
					c = new LexerATNConfig(config, pt.target);
				}
				break;

			case Transition.ACTION:
				if (config.context == null || config.context.hasEmptyPath()) {
					// execute actions anywhere in the start rule for a token.
					//
					// TODO: if the entry rule is invoked recursively, some
					// actions may be executed during the recursive call. The
					// problem can appear when hasEmptyPath() is true but
					// isEmpty() is false. In this case, the config needs to be
					// split into two contexts - one with just the empty path
					// and another with everything but the empty path.
					// Unfortunately, the current algorithm does not allow
					// getEpsilonTarget to return two configurations, so
					// additional modifications are needed before we can support
                    // the split operation.
                    var at = /** @type {org.antlr.v4.runtime.atn.ActionTransition} */ (t);
					var lexerActionExecutor = LexerActionExecutor.append(
                        config.getLexerActionExecutor(),
                        this.atn.lexerActions[at.actionIndex]);
					c = new LexerATNConfig(config, at.target, lexerActionExecutor);
					break;
				}
				else {
					// ignore actions in referenced rules
					c = new LexerATNConfig(config, t.target);
					break;
				}

			case Transition.EPSILON:
				c = new LexerATNConfig(config, t.target);
				break;

			case Transition.ATOM:
			case Transition.RANGE:
			case Transition.SET:
				if (treatEofAsEpsilon) {
					if (t.matches(CharStream.EOF, Lexer.MIN_CHAR_VALUE, Lexer.MAX_CHAR_VALUE)) {
						c = new LexerATNConfig(config, t.target);
						break;
					}
				}

				break;
		}

		return c;
    }

    /**
     * Evaluate a predicate specified in the lexer.
     *
     * <p>If {@code speculative} is {@code true}, this method was called before
     * {@link #consume} for the matched character. This method should call
     * {@link #consume} before evaluating the predicate to ensure position
     * sensitive values, including {@link Lexer#getText}, {@link Lexer#getLine},
     * and {@link Lexer#getCharPositionInLine}, properly reflect the current
     * lexer state. This method should restore {@code input} and the simulator
     * to the original state before returning (i.e. undo the actions made by the
     * call to {@link #consume}.</p>
     *
     * @protected
     * @param {CharStream} input The input stream.
     * @param {number} ruleIndex The rule containing the predicate.
     * @param {number} predIndex The index of the predicate within the rule.
     * @param {boolean} speculative {@code true} if the current index in {@code input} is
     * one character before the predicate's location.
     *
     * @return  {boolean} {@code true} if the specified predicate evaluates to
     * {@code true}.
     */
    evaluatePredicate(input, ruleIndex, predIndex, speculative) {
        // assume true if no recognizer was provided
        if (this.recog == null) {
            return true;
        }

        if (!speculative) {
            return this.recog.sempred(null, ruleIndex, predIndex);
        }

        var savedCharPositionInLine = this.charPositionInLine;
        var savedLine = this.line;
        var index = input.index();
        var marker = input.mark();
        try {
            this.consume(input);
            return this.recog.sempred(null, ruleIndex, predIndex);
        }
        finally {
            this.charPositionInLine = savedCharPositionInLine;
            this.line = savedLine;
            input.seek(index);
            input.release(marker);
        }
    }

    /**
     * @protected
     * @param {SimState} settings
     * @param {CharStream} input
     * @param {DFAState} dfaState
     * @return {void}
     */
    captureSimState(settings, input, dfaState) {
        settings.index = input.index();
        settings.line = this.line;
        settings.charPos = this.charPositionInLine;
        settings.dfaState = dfaState;
    }

    /**
     * @protected
     * @param {DFAState} p
     * @param {number} t
     * @param {!(org.antlr.v4.runtime.atn.ATNConfigSet|DFAState)} q
     * @return {DFAState}
     */
    addDFAEdge(p, t, q) {
        if (!(q instanceof DFAState)) {
            /* leading to this call, ATNConfigSet.hasSemanticContext is used as a
             * marker indicating dynamic predicate evaluation makes this edge
             * dependent on the specific input sequence, so the static edge in the
             * DFA should be omitted. The target DFAState is still created since
             * execATN has the ability to resynchronize with the DFA state cache
             * following the predicate evaluation step.
             *
             * TJP notes: next time through the DFA, we see a pred again and eval.
             * If that gets us to a previously created (but dangling) DFA
             * state, we can continue in pure DFA mode from there.
             */
            q = /** @type {!org.antlr.v4.runtime.atn.ATNConfigSet} */ (q);
            var suppressEdge = q.hasSemanticContext;
            q.hasSemanticContext = false;

            q = this.addDFAState(q);

            if (suppressEdge) {
                return q;
            }
        }

        if (t < LexerATNSimulator.MIN_DFA_EDGE || t > LexerATNSimulator.MAX_DFA_EDGE) {
            // Only track edges within the DFA bounds
            return null;
        }

        if (LexerATNSimulator.debug) {
            console.log("EDGE " + p + " -> " + q + " upon " + t);
        }

        if (p.edges == null) {
            //  make room for tokens 1..n and -1 masquerading as index 0
            p.edges = [];
        }
        p.edges[t - LexerATNSimulator.MIN_DFA_EDGE] = q; // connect

		return q;
    }

    /** Add a new DFA state if there isn't one with this set of
        configurations already. This method also detects the first
        configuration containing an ATN rule stop state. Later, when
        traversing the DFA, we will know which rule to accept.
     */

    /**
     * @protected
     * @param {org.antlr.v4.runtime.atn.ATNConfigSet} configs
     * @return {!DFAState}
     */
    addDFAState(configs) {
        /* the lexer evaluates predicates on-the-fly; by this point configs
         * should not contain any configurations with unevaluated predicates.
         */
        assert(!configs.hasSemanticContext);
        var proposed = new DFAState(configs);
        /**
         * @type {org.antlr.v4.runtime.atn.ATNConfig}
         */
        var firstConfigWithRuleStopState = null;
        for (const c of configs) {
            if ( c.state instanceof RuleStopState )	{
                firstConfigWithRuleStopState = c;
                break;
            }
        }

        if (firstConfigWithRuleStopState != null) {
            proposed.isAcceptState = true;
            proposed.lexerActionExecutor = firstConfigWithRuleStopState.getLexerActionExecutor();
            proposed.prediction = this.atn.ruleToTokenType[firstConfigWithRuleStopState.state.ruleIndex];
        }

        var dfa = this.decisionToDFA[this.mode];

        var existing = dfa.states.get(proposed);
        if (existing != null) return existing;

        var newState = proposed;

        newState.stateNumber = dfa.states.size();
        configs.setReadonly(true);
        newState.configs = configs;
        dfa.states.put(newState, newState);
        return newState;
    }

    /**
     * @param {number} mode
     * @return {org.antlr.v4.runtime.dfa.DFA}
     */
    getDFA(mode) {
        return this.decisionToDFA[mode];
    }

    /**
     * Get the text matched so far for the current token.
     *
     * @param {CharStream} input
     * @return {string}
     */
    getText(input) {
        // index is first lookahead char, don't include.
        return input.getText(Interval.of(this.startIndex, input.index() - 1));
    }

    /**
     * @return {number}
     */
    getLine() {
        return this.line;
    }

    /**
     * @param {number} line
     * @return {void}
     */
    setLine(line) {
        this.line = line;
    }

    /**
     * @return {number}
     */
    getCharPositionInLine() {
        return this.charPositionInLine;
    }

    /**
     * @param {number} charPositionInLine
     * @return {void}
     */
    setCharPositionInLine(charPositionInLine) {
        this.charPositionInLine = charPositionInLine;
    }

    /**
     * @param {CharStream} input
     * @return {void}
     */
    consume(input) {
        var curChar = input.LA(1);
        if (curChar === "\n".charCodeAt(0)) {
            this.line++;
            this.charPositionInLine = 0;
        }
        else {
            this.charPositionInLine++;
        }
        input.consume();
    }

    /**
     * @param {number} t
     * @return {string}
     */
    getTokenName(t) {
        if (t === -1) return "EOF";
        //if ( atn.g!=null ) return atn.g.getTokenDisplayName(t);
        return "'" + t + "'";
    }
}

LexerATNSimulator.SimState = SimState;

/**
 * @type {boolean}
 */
LexerATNSimulator.debug = false;

/**
 * @type {boolean}
 */
LexerATNSimulator.dfa_debug = false;

/**
 * @type {number}
 */
LexerATNSimulator.MIN_DFA_EDGE = 0;

/**
 * @type {number}
 */
LexerATNSimulator.MAX_DFA_EDGE = 127; // forces unicode to stay in ATN

/**
 * @type {number}
 */
LexerATNSimulator.match_calls = 0;


exports = LexerATNSimulator;
