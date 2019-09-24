/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.ATNDeserializer');
goog.module.declareLegacyNamespace();


const Token = goog.require('org.antlr.v4.runtime.Token');
const ATN = goog.require('org.antlr.v4.runtime.atn.ATN');
const ATNType = goog.require('org.antlr.v4.runtime.atn.ATNType');
const LexerActionType = goog.require('org.antlr.v4.runtime.atn.LexerActionType');
const LexerCustomAction = goog.require('org.antlr.v4.runtime.atn.LexerCustomAction');
const LexerChannelAction = goog.require('org.antlr.v4.runtime.atn.LexerChannelAction');
const LexerModeAction = goog.require('org.antlr.v4.runtime.atn.LexerModeAction');
const LexerMoreAction = goog.require('org.antlr.v4.runtime.atn.LexerMoreAction');
const LexerPopModeAction = goog.require('org.antlr.v4.runtime.atn.LexerPopModeAction');
const LexerPushModeAction = goog.require('org.antlr.v4.runtime.atn.LexerPushModeAction');
const LexerSkipAction = goog.require('org.antlr.v4.runtime.atn.LexerSkipAction');
const LexerTypeAction = goog.require('org.antlr.v4.runtime.atn.LexerTypeAction');
const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');
const BasicState = goog.require('org.antlr.v4.runtime.atn.BasicState');
const RuleStopState = goog.require('org.antlr.v4.runtime.atn.RuleStopState');
const RuleStartState = goog.require('org.antlr.v4.runtime.atn.RuleStartState');
const BlockStartState = goog.require('org.antlr.v4.runtime.atn.BlockStartState');
const PlusLoopbackState = goog.require('org.antlr.v4.runtime.atn.PlusLoopbackState');
const PlusBlockStartState = goog.require('org.antlr.v4.runtime.atn.PlusBlockStartState');
const StarLoopbackState = goog.require('org.antlr.v4.runtime.atn.StarLoopbackState');
const StarLoopEntryState = goog.require('org.antlr.v4.runtime.atn.StarLoopEntryState');
const BasicBlockStartState = goog.require('org.antlr.v4.runtime.atn.BasicBlockStartState');
const BlockEndState = goog.require('org.antlr.v4.runtime.atn.BlockEndState');
const LoopEndState = goog.require('org.antlr.v4.runtime.atn.LoopEndState');
const StarBlockStartState = goog.require('org.antlr.v4.runtime.atn.StarBlockStartState');
const DecisionState = goog.require('org.antlr.v4.runtime.atn.DecisionState');
const TokensStartState = goog.require('org.antlr.v4.runtime.atn.TokensStartState');
const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');
const RuleTransition = goog.require('org.antlr.v4.runtime.atn.RuleTransition');
const EpsilonTransition = goog.require('org.antlr.v4.runtime.atn.EpsilonTransition');
const RangeTransition = goog.require('org.antlr.v4.runtime.atn.RangeTransition');
const ActionTransition = goog.require('org.antlr.v4.runtime.atn.ActionTransition');
const AtomTransition = goog.require('org.antlr.v4.runtime.atn.AtomTransition');
const PredicateTransition = goog.require('org.antlr.v4.runtime.atn.PredicateTransition');
const PrecedencePredicateTransition = goog.require('org.antlr.v4.runtime.atn.PrecedencePredicateTransition');
const SetTransition = goog.require('org.antlr.v4.runtime.atn.SetTransition');
const NotSetTransition = goog.require('org.antlr.v4.runtime.atn.NotSetTransition');
const WildcardTransition = goog.require('org.antlr.v4.runtime.atn.WildcardTransition');
const ATNDeserializationOptions = goog.require('org.antlr.v4.runtime.atn.ATNDeserializationOptions');
const IntervalSet = goog.require('org.antlr.v4.runtime.misc.IntervalSet');
const Pair = goog.require('org.antlr.v4.runtime.misc.Pair');
const {format} = goog.require("goog.string");

const BYTE_HEX = [];
for (var i = 0; i < 256; i++) {
    BYTE_HEX[i] = (i + 0x100).toString(16).substr(1).toUpperCase();
}

/**
 *
 * @author Sam Harwell
 */
class ATNDeserializer {
    /**
     * @param {ATNDeserializationOptions} deserializationOptions
     */
    constructor(deserializationOptions) {
        if (deserializationOptions == null) {
            deserializationOptions = ATNDeserializationOptions.getDefaultOptions();
        }
        /**
         * @private {ATNDeserializationOptions}
         */
        this.deserializationOptions = deserializationOptions;
    }

    /**
     * @suppress {deprecated}
     * @param {string} str
     * @return {ATN}
     */
    deserialize(str) {
        /**
         * @type {Array<number>}
         */
        var data = [str.charCodeAt(0)];
        // Each char value in data is shifted by +2 at the entry to this method.
        // This is an encoding optimization targeting the serialized values 0
        // and -1 (serialized to 0xFFFF), each of which are very common in the
        // serialized form of the ATN. In the modified UTF-8 that Java uses for
        // compiled string literals, these two character values have multi-byte
        // forms. By shifting each value by +2, they become characters 2 and 1
        // prior to writing the string, each of which have single-byte
        // representations. Since the shift occurs in the tool during ATN
        // serialization, each target is responsible for adjusting the values
        // during deserialization.
        //
        // As a special case, note that the first element of data is not
        // adjusted because it contains the major version number of the
        // serialized ATN, which was fixed at 3 at the time the value shifting
        // was implemented.
        for (var i = 1; i < str.length; i++) {
            var v = str.charCodeAt(i);
            data[i] = v > 1  ? v - 2 : v + 65533;
        }
        var p = 0;
        var version = ATNDeserializer.toInt(data[p++]);
        if (version !== ATNDeserializer.SERIALIZED_VERSION) {
            var reason = format("Could not deserialize ATN with version %d (expected %d).", version, ATNDeserializer.SERIALIZED_VERSION);
            throw new Error(reason);
        }
        var uuid = ATNDeserializer.toUUID(data, p);
        p += 8;
        if (!ATNDeserializer.SUPPORTED_UUIDS.indexOf(uuid) < 0) {
            var reason = format("Could not deserialize ATN with UUID %s (expected %s or a legacy UUID).", uuid, ATNDeserializer.SERIALIZED_UUID);
            throw new Error(reason);
        }
        var supportsPrecedencePredicates = ATNDeserializer.isFeatureSupported(ATNDeserializer.ADDED_PRECEDENCE_TRANSITIONS, uuid);
        var supportsLexerActions = ATNDeserializer.isFeatureSupported(ATNDeserializer.ADDED_LEXER_ACTIONS, uuid);
        var grammarType = Object.values(ATNType)[ATNDeserializer.toInt(data[p++])];
        var maxTokenType = ATNDeserializer.toInt(data[p++]);
        var atn = new ATN(grammarType, maxTokenType);
        /**
         * @type {!Array<Pair<LoopEndState, number>>}
         */
        var loopBackStateNumbers = [];
        /**
         * @type {!Array<Pair<BlockStartState, number>>}
         */
        var endStateNumbers = [];
        var nstates = ATNDeserializer.toInt(data[p++]);
        for (var i = 0; i < nstates; i++) {
            var stype = ATNDeserializer.toInt(data[p++]);
            // ignore bad type of states
            if (stype === ATNState.INVALID_TYPE ) {
                atn.addState(null);
                continue;
            }
            var ruleIndex = ATNDeserializer.toInt(data[p++]);
            if (ruleIndex === 0xFFFF) {
                ruleIndex = -1;
            }

            var s = this.stateFactory(stype, ruleIndex);
            if (stype === ATNState.LOOP_END) { // special case
                var loopBackStateNumber = ATNDeserializer.toInt(data[p++]);
                s = /** @type {LoopEndState} */ (s);
                loopBackStateNumbers.push(new Pair(s, loopBackStateNumber));
            }
            else if (s instanceof BlockStartState) {
                var endStateNumber = ATNDeserializer.toInt(data[p++]);
                s = /** @type {BlockStartState} */ (s);
                endStateNumbers.push(new Pair(s, endStateNumber));
            }
            atn.addState(s);
        }

        // delay the assignment of loop back and end states until we know all the state instances have been initialized
        for (const pair of loopBackStateNumbers) {
            pair.a.loopBackState = atn.states[pair.b];
        }

        for (const pair of endStateNumbers) {
            pair.a.endState = /** @type {BlockEndState} */ (atn.states[pair.b]);
        }

        var numNonGreedyStates = ATNDeserializer.toInt(data[p++]);
        for (var i = 0; i < numNonGreedyStates; i++) {
            var stateNumber = ATNDeserializer.toInt(data[p++]);
            var st = /** @type {DecisionState} */ (atn.states[stateNumber]);
            st.nonGreedy = true;
        }

        if (supportsPrecedencePredicates) {
            var numPrecedenceStates = ATNDeserializer.toInt(data[p++]);
            for (var i = 0; i < numPrecedenceStates; i++) {
                var stateNumber = ATNDeserializer.toInt(data[p++]);
                var st = /** @type {RuleStartState} */ (atn.states[stateNumber]);
                st.isLeftRecursiveRule = true;
            }
        }

        //
        // RULES
        //
        var nrules = ATNDeserializer.toInt(data[p++]);
        if (atn.grammarType === ATNType.LEXER) {
            /**
             * @type {Array<number>}
             */
            atn.ruleToTokenType = [];
        }

        /**
         * @type {!Array<RuleStartState>}
         */
        atn.ruleToStartState = [];
        for (var i = 0; i < nrules; i++) {
            var s = ATNDeserializer.toInt(data[p++]);
            var startState = /** @type {RuleStartState} */ (atn.states[s]);
            atn.ruleToStartState[i] = startState;
            if (atn.grammarType === ATNType.LEXER) {
                var tokenType = ATNDeserializer.toInt(data[p++]);
                if (tokenType === 0xFFFF) {
                    tokenType = Token.EOF;
                }

                atn.ruleToTokenType[i] = tokenType;

                if (!ATNDeserializer.isFeatureSupported(ATNDeserializer.ADDED_LEXER_ACTIONS, uuid)) {
                    // this piece of unused metadata was serialized prior to the
                    // addition of LexerAction
                    var actionIndexIgnored = ATNDeserializer.toInt(data[p++]);
                }
            }
        }

        /**
         * @type {!Array<RuleStopState>}
         */
        atn.ruleToStopState = [];
        for (const state of atn.states) {
            if (!(state instanceof RuleStopState)) {
                continue;
            }

            atn.ruleToStopState[state.ruleIndex] = state;
            atn.ruleToStartState[state.ruleIndex].stopState = state;
        }

        //
        // MODES
        //
        var nmodes = ATNDeserializer.toInt(data[p++]);
        for (var i = 0; i < nmodes; i++) {
            var s = ATNDeserializer.toInt(data[p++]);
            atn.modeToStartState.push(/** @type {TokensStartState} */ (atn.states[s]));
        }

        //
        // SETS
        //
        /**
         * @type {Array<IntervalSet>}
         */
        var sets = [];

        // First, read all sets with 16-bit Unicode code points <= U+FFFF.
        p = this.deserializeSets(data, p, sets, ATNDeserializer.toInt, 1);

        // Next, if the ATN was serialized with the Unicode SMP feature,
        // deserialize sets with 32-bit arguments <= U+10FFFF.
        if (ATNDeserializer.isFeatureSupported(ATNDeserializer.ADDED_UNICODE_SMP, uuid)) {
            p = this.deserializeSets(data, p, sets, ATNDeserializer.toInt32, 2);
        }

        //
		// EDGES
		//
		var nedges = ATNDeserializer.toInt(data[p++]);
		for (var i = 0; i < nedges; i++) {
			var src = ATNDeserializer.toInt(data[p]);
			var trg = ATNDeserializer.toInt(data[p + 1]);
			var ttype = ATNDeserializer.toInt(data[p + 2]);
			var arg1 = ATNDeserializer.toInt(data[p + 3]);
			var arg2 = ATNDeserializer.toInt(data[p + 4]);
			var arg3 = ATNDeserializer.toInt(data[p + 5]);
			var trans = this.edgeFactory(atn, ttype, src, trg, arg1, arg2, arg3, sets);
//			System.out.println("EDGE "+trans.getClass().getSimpleName()+" "+
//							   src+"->"+trg+
//					   " "+Transition.serializationNames[ttype]+
//					   " "+arg1+","+arg2+","+arg3);
			var srcState = atn.states[src];
			srcState.addTransition(trans);
			p += 6;
        }

        // edges for rule stop states can be derived, so they aren't serialized
        for (const state of atn.states) {
            for (var i = 0; i < state.getNumberOfTransitions(); i++) {
                var t = state.transition(i);
                if (!(t instanceof RuleTransition)) {
                    continue;
                }

                /**
                 * @type {RuleTransition}
                 */
                var ruleTransition = t;
                var outermostPrecedenceReturn = -1;
                if (atn.ruleToStartState[ruleTransition.target.ruleIndex].isLeftRecursiveRule) {
                    if (ruleTransition.precedence === 0) {
                        outermostPrecedenceReturn = ruleTransition.target.ruleIndex;
                    }
                }

                var returnTransition = new EpsilonTransition(ruleTransition.followState, outermostPrecedenceReturn);
                atn.ruleToStopState[ruleTransition.target.ruleIndex].addTransition(returnTransition);
            }
        }

        for (const state of atn.states) {
            if (state instanceof BlockStartState) {
                // we need to know the end state to set its start state
                if (state.endState == null) {
                    throw new Error("Illegal state");
                }

                // block end states can only be associated to a single block start state
                if (state.endState.startState != null) {
                    throw new Error("Illegal state");
                }

                state.endState.startState = state;
            }

            if (state instanceof PlusLoopbackState) {
                let loopbackState = /** @type {PlusLoopbackState} */ (state);
                for (var i = 0; i < loopbackState.getNumberOfTransitions(); i++) {
                    var target = loopbackState.transition(i).target;
                    if (target instanceof PlusBlockStartState) {
                        var t = /** @type {PlusBlockStartState} */ (target);
                        t.loopBackState = loopbackState;
                    }
                }
            }
            else if (state instanceof StarLoopbackState) {
                let loopbackState = /** @type {StarLoopbackState} */ (state);
                for (var i = 0; i < loopbackState.getNumberOfTransitions(); i++) {
                    var target = loopbackState.transition(i).target;
                    if (target instanceof StarLoopEntryState) {
                        var t = /** @type {StarLoopEntryState} */ (target);
                        t.loopBackState = loopbackState;
                    }
                }
            }
        }

        //
        // DECISIONS
        //
        var ndecisions = ATNDeserializer.toInt(data[p++]);
        for (var i = 1; i <= ndecisions; i++) {
            var s = ATNDeserializer.toInt(data[p++]);
            var decState = /** @type {DecisionState} */ (atn.states[s]);
            atn.decisionToState.push(decState);
            decState.decision = i - 1;
        }

        //
        // LEXER ACTIONS
        //
        if (atn.grammarType === ATNType.LEXER) {
            if (supportsLexerActions) {
                var count = ATNDeserializer.toInt(data[p++]);
                /**
                 * @type {Array<org.antlr.v4.runtime.atn.LexerAction>}
                 */
                atn.lexerActions = [];
                for (var i = 0; i < count; i++) {
                    var actionType = Object.values(LexerActionType)[ATNDeserializer.toInt(data[p++])];
                    var data1 = ATNDeserializer.toInt(data[p++]);
                    if (data1 === 0xFFFF) {
                        data1 = -1;
                    }

                    var data2 = ATNDeserializer.toInt(data[p++]);
                    if (data2 === 0xFFFF) {
                        data2 = -1;
                    }

                    var lexerAction = this.lexerActionFactory(actionType, data1, data2);

                    atn.lexerActions[i] = lexerAction;
                }
            }
            else {
                // for compatibility with older serialized ATNs, convert the old
                // serialized action index for action transitions to the new
                // form, which is the index of a LexerCustomAction
                /**
                 * @type {!Array<org.antlr.v4.runtime.atn.LexerAction>}
                 */
                var legacyLexerActions = [];
                for (const state of atn.states) {
                    for (var i = 0; i < state.getNumberOfTransitions(); i++) {
                        var transition = state.transition(i);
                        if (!(transition instanceof ActionTransition)) {
                            continue;
                        }

                        var ruleIndex = transition.ruleIndex;
                        var actionIndex = transition.actionIndex;
                        var lexerAction = new LexerCustomAction(ruleIndex, actionIndex);
                        state.setTransition(i, new ActionTransition(transition.target, ruleIndex, legacyLexerActions.length, false));
                        legacyLexerActions.push(lexerAction);
                    }
                }

                atn.lexerActions = legacyLexerActions;
            }
        }

        this.markPrecedenceDecisions(atn);

        if (this.deserializationOptions.isVerifyATN()) {
            this.verifyATN(atn);
        }

        if (this.deserializationOptions.isGenerateRuleBypassTransitions() && atn.grammarType === ATNType.PARSER) {
            atn.ruleToTokenType = [];
            for (var i = 0; i < atn.ruleToStartState.length; i++) {
                atn.ruleToTokenType[i] = atn.maxTokenType + i + 1;
            }

            for (var i = 0; i < atn.ruleToStartState.length; i++) {
                var bypassStart = new BasicBlockStartState();
                bypassStart.ruleIndex = i;
                atn.addState(bypassStart);

                var bypassStop = new BlockEndState();
                bypassStop.ruleIndex = i;
                atn.addState(bypassStop);

                bypassStart.endState = bypassStop;
                atn.defineDecisionState(bypassStart);

                bypassStop.startState = bypassStart;

                /**
                 * @type {org.antlr.v4.runtime.atn.ATNState}
                 */
                var endState;
                /**
                 * @type {org.antlr.v4.runtime.atn.Transition}
                 */
                var excludeTransition = null;
                if (atn.ruleToStartState[i].isLeftRecursiveRule) {
                    // wrap from the beginning of the rule to the StarLoopEntryState
                    endState = null;
                    for (const state of atn.states) {
                        if (state.ruleIndex !== i) {
                            continue;
                        }

                        if (!(state instanceof StarLoopEntryState)) {
                            continue;
                        }

                        var maybeLoopEndState = state.transition(state.getNumberOfTransitions() - 1).target;
                        if (!(maybeLoopEndState instanceof LoopEndState)) {
                            continue;
                        }

                        if (maybeLoopEndState.epsilonOnlyTransitions && maybeLoopEndState.transition(0).target instanceof RuleStopState) {
                            endState = state;
                            break;
                        }
                    }

                    if (endState === null) {
                        throw new Error("Couldn't identify final state of the precedence rule prefix section.");
                    }

                    excludeTransition = endState.loopBackState.transition(0);
                }
                else {
                    endState = atn.ruleToStopState[i];
                }

                // all non-excluded transitions that currently target end state need to target blockEnd instead
                for (const state of atn.states) {
                    for (const transition of state.getTransitions()) {
                        if (transition === excludeTransition) {
                            continue;
                        }

                        if (transition.target === endState) {
                            transition.target = bypassStop;
                        }
                    }
                }

                // all transitions leaving the rule start state need to leave blockStart instead
                while (atn.ruleToStartState[i].getNumberOfTransitions() > 0) {
                    var transition = atn.ruleToStartState[i].removeTransition(atn.ruleToStartState[i].getNumberOfTransitions() - 1);
                    bypassStart.addTransition(transition);
                }

                // link the new states
                atn.ruleToStartState[i].addTransition(new EpsilonTransition(bypassStart));
                bypassStop.addTransition(new EpsilonTransition(endState));

                var matchState = new BasicState();
                atn.addState(matchState);
                matchState.addTransition(new AtomTransition(bypassStop, atn.ruleToTokenType[i]));
                bypassStart.addTransition(new EpsilonTransition(matchState));
            }

            if (this.deserializationOptions.isVerifyATN()) {
                // reverify after modification
                this.verifyATN(atn);
            }
        }

        return atn;
    }

    /**
     * @private
     * @param {Array<number>} data
     * @param {number} p
     * @param {Array<IntervalSet>} sets
     * @param {Function} reader
     * @param {number} size
     * @return {number}
     */
    deserializeSets(data, p, sets, reader, size) {
        var nsets = ATNDeserializer.toInt(data[p++]);
        for (var i = 0; i < nsets; i++) {
            var nintervals = ATNDeserializer.toInt(data[p]);
            p++;
            var set = new IntervalSet();
            sets.push(set);

            var containsEof = ATNDeserializer.toInt(data[p++]) !== 0;
            if (containsEof) {
                set.add(-1);
            }

            for (var j = 0; j < nintervals; j++) {
                var a = reader(data, p);
                p += size;
                var b = reader(data, p);
                p += size;
                set.addRange(a, b);
            }
        }
        return p;
    }

    /**
     * Analyze the {@link StarLoopEntryState} states in the specified ATN to set
     * the {@link StarLoopEntryState#isPrecedenceDecision} field to the
     * correct value.
     *
     * @protected
     * @param {ATN} atn The ATN.
     * @return {void}
     */
    markPrecedenceDecisions(atn) {
        for (const state of atn.states) {
            if (!(state instanceof StarLoopEntryState)) {
                continue;
            }

            /* We analyze the ATN to determine if this ATN decision state is the
             * decision for the closure block that determines whether a
             * precedence rule should continue or complete.
             */
            if (atn.ruleToStartState[state.ruleIndex].isLeftRecursiveRule) {
                var maybeLoopEndState = state.transition(state.getNumberOfTransitions() - 1).target;
                if (maybeLoopEndState instanceof LoopEndState) {
                    if (maybeLoopEndState.epsilonOnlyTransitions && maybeLoopEndState.transition(0).target instanceof RuleStopState) {
                        state.isPrecedenceDecision = true;
                    }
                }
            }
        }
    }

    /**
     * @protected
     * @param {ATN} atn
     * @return {void}
     */
    verifyATN(atn) {
        // verify assumptions
        for (const state of atn.states) {
            if (state == null) {
                continue;
            }

            this.checkCondition(state.onlyHasEpsilonTransitions() || state.getNumberOfTransitions() <= 1);

            if (state instanceof PlusBlockStartState) {
                this.checkCondition(state.loopBackState != null);
            }

            if (state instanceof StarLoopEntryState) {
                this.checkCondition(state.loopBackState != null);
                this.checkCondition(state.getNumberOfTransitions() == 2);

                if (state.transition(0).target instanceof StarBlockStartState) {
                    this.checkCondition(state.transition(1).target instanceof LoopEndState);
                    this.checkCondition(!state.nonGreedy);
                }
                else if (state.transition(0).target instanceof LoopEndState) {
                    this.checkCondition(state.transition(1).target instanceof StarBlockStartState);
                    this.checkCondition(state.nonGreedy);
                }
                else {
                    throw new Error("Illegal state");
                }
            }

            if (state instanceof StarLoopbackState) {
                this.checkCondition(state.getNumberOfTransitions() == 1);
                this.checkCondition(state.transition(0).target instanceof StarLoopEntryState);
            }

            if (state instanceof LoopEndState) {
                this.checkCondition(state.loopBackState != null);
            }

            if (state instanceof RuleStartState) {
                this.checkCondition(state.stopState != null);
            }

            if (state instanceof BlockStartState) {
                this.checkCondition(state.endState != null);
            }

            if (state instanceof BlockEndState) {
                this.checkCondition(state.startState != null);
            }

            if (state instanceof DecisionState) {
                this.checkCondition(state.getNumberOfTransitions() <= 1 || state.decision >= 0);
            }
            else {
                this.checkCondition(state.getNumberOfTransitions() <= 1 || state instanceof RuleStopState);
            }
        }
    }

    /**
     * @protected
     * @param {boolean} condition
     * @param {string=} message
     */
    checkCondition(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * @protected
     * @param {ATN} atn
     * @param {number} type
     * @param {number} src
     * @param {number} trg
     * @param {number} arg1
     * @param {number} arg2
     * @param {number} arg3
     * @param {Array<IntervalSet>} sets
     * @return {Transition}
     */
    edgeFactory(atn, type, src, trg, arg1, arg2, arg3, sets) {
		var target = atn.states[trg];
		switch (type) {
			case Transition.EPSILON : return new EpsilonTransition(target);
			case Transition.RANGE :
				if (arg3 !== 0) {
					return new RangeTransition(target, Token.EOF, arg2);
				}
				else {
					return new RangeTransition(target, arg1, arg2);
				}
			case Transition.RULE :
                var rss = /** @type {RuleStartState} */ (atn.states[arg1]);
				var rt = new RuleTransition(rss, arg2, arg3, target);
				return rt;
			case Transition.PREDICATE :
				var pt = new PredicateTransition(target, arg1, arg2, arg3 !== 0);
				return pt;
			case Transition.PRECEDENCE:
				return new PrecedencePredicateTransition(target, arg1);
			case Transition.ATOM :
				if (arg3 != 0) {
					return new AtomTransition(target, Token.EOF);
				}
				else {
					return new AtomTransition(target, arg1);
				}
			case Transition.ACTION :
				var a = new ActionTransition(target, arg1, arg2, arg3 !== 0);
				return a;
			case Transition.SET : return new SetTransition(target, sets[arg1]);
			case Transition.NOT_SET : return new NotSetTransition(target, sets[arg1]);
			case Transition.WILDCARD : return new WildcardTransition(target);
		}

		throw new Error("The specified transition type is not valid.");
    }

    /**
     * @protected
     * @param {number} type
     * @param {number} ruleIndex
     * @return {ATNState}
     */
    stateFactory(type, ruleIndex) {
        /**
         * @type {ATNState}
         */
        var s;
        switch (type) {
            case ATNState.INVALID_TYPE: return null;
            case ATNState.BASIC : s = new BasicState(); break;
            case ATNState.RULE_START : s = new RuleStartState(); break;
            case ATNState.BLOCK_START : s = new BasicBlockStartState(); break;
            case ATNState.PLUS_BLOCK_START : s = new PlusBlockStartState(); break;
            case ATNState.STAR_BLOCK_START : s = new StarBlockStartState(); break;
            case ATNState.TOKEN_START : s = new TokensStartState(); break;
            case ATNState.RULE_STOP : s = new RuleStopState(); break;
            case ATNState.BLOCK_END : s = new BlockEndState(); break;
            case ATNState.STAR_LOOP_BACK : s = new StarLoopbackState(); break;
            case ATNState.STAR_LOOP_ENTRY : s = new StarLoopEntryState(); break;
            case ATNState.PLUS_LOOP_BACK : s = new PlusLoopbackState(); break;
            case ATNState.LOOP_END : s = new LoopEndState(); break;
            default :
                var message = format("The specified state type %d is not valid.", type);
                throw new Error(message);
        }

        s.ruleIndex = ruleIndex;
        return s;
    }

    /**
     * @protected
     * @param {number} type
     * @param {number} data1
     * @param {number} data2
     * @return {org.antlr.v4.runtime.atn.LexerAction}
     */
    lexerActionFactory(type, data1, data2) {
        switch (type) {
        case LexerActionType.CHANNEL:
            return new LexerChannelAction(data1);

        case LexerActionType.CUSTOM:
            return new LexerCustomAction(data1, data2);

        case LexerActionType.MODE:
            return new LexerModeAction(data1);

        case LexerActionType.MORE:
            return LexerMoreAction.INSTANCE;

        case LexerActionType.POP_MODE:
            return LexerPopModeAction.INSTANCE;

        case LexerActionType.PUSH_MODE:
            return new LexerPushModeAction(data1);

        case LexerActionType.SKIP:
            return LexerSkipAction.INSTANCE;

        case LexerActionType.TYPE:
            return new LexerTypeAction(data1);

        default:
            var message = format("The specified lexer action type %d is not valid.", type);
            throw new Error(message);
        }
    }
}

/**
 * This value should never change. Updates following this version are
 * reflected as change in the unique ID SERIALIZED_UUID.
 *
 * @type {number}
 */
ATNDeserializer.SERIALIZED_VERSION = 3;

/**
 * This is the earliest supported serialized UUID.
 *
 * @type {string}
 */
ATNDeserializer.BASE_SERIALIZED_UUID = "33761B2D-78BB-4A43-8B0B-4F5BEE8AACF3";
/**
 * This UUID indicates an extension of {@link BASE_SERIALIZED_UUID} for the
 * addition of precedence predicates.
 *
 * @type {string}
 */
ATNDeserializer.ADDED_PRECEDENCE_TRANSITIONS = "1DA0C57D-6C06-438A-9B27-10BCB3CE0F61";
/**
 * This UUID indicates an extension of {@link #ADDED_PRECEDENCE_TRANSITIONS}
 * for the addition of lexer actions encoded as a sequence of
 * {@link LexerAction} instances.
 *
 * @type {string}
 */
ATNDeserializer.ADDED_LEXER_ACTIONS = "AADB8D7E-AEEF-4415-AD2B-8204D6CF042E";
/**
 * This UUID indicates the serialized ATN contains two sets of
 * IntervalSets, where the second set's values are encoded as
 * 32-bit integers to support the full Unicode SMP range up to U+10FFFF.
 *
 * @type {string}
 */
ATNDeserializer.ADDED_UNICODE_SMP = "59627784-3BE5-417A-B9EB-8131A7286089";
/**
 * This list contains all of the currently supported UUIDs, ordered by when
 * the feature first appeared in this branch.
 *
 * @type {Array<string>}
 */
ATNDeserializer.SUPPORTED_UUIDS = [
    ATNDeserializer.BASE_SERIALIZED_UUID,
    ATNDeserializer.ADDED_PRECEDENCE_TRANSITIONS,
    ATNDeserializer.ADDED_LEXER_ACTIONS,
    ATNDeserializer.ADDED_UNICODE_SMP
];

/**
 * This is the current serialized UUID.
 *
 * @type {string}
 */
ATNDeserializer.SERIALIZED_UUID = ATNDeserializer.ADDED_UNICODE_SMP;

/**
 * Determines if a particular serialized representation of an ATN supports
 * a particular feature, identified by the {@link UUID} used for serializing
 * the ATN at the time the feature was first introduced.
 *
 * @protected
 * @param {string} feature The {@link UUID} marking the first time the feature was
 * supported in the serialized ATN.
 * @param {string} actualUuid The {@link UUID} of the actual serialized ATN which is
 * currently being deserialized.
 * @return {boolean} {@code true} if the {@code actualUuid} value represents a
 * serialized ATN at or after the feature identified by {@code feature} was
 * introduced; otherwise, {@code false}.
 */
ATNDeserializer.isFeatureSupported = function (feature, actualUuid) {
    var featureIndex = ATNDeserializer.SUPPORTED_UUIDS.indexOf(feature);
    if (featureIndex < 0) {
        return false;
    }
    return ATNDeserializer.SUPPORTED_UUIDS.indexOf(actualUuid) >= featureIndex;
};

/**
 * @protected
 * @param {number} c
 * @return {number}
 */
ATNDeserializer.toInt = function (c) {
    return c;
};

/**
 * @param {Array<number>} data
 * @param {number} offset
 * @return {number}
 */
ATNDeserializer.toInt32 = function (data, offset) {
    return data[offset] | (data[offset + 1] << 16);
};

/**
 * @param {Array<number>} data
 * @param {number} offset
 * @return {number}
 */
ATNDeserializer.toLong = function (data, offset) {
    var low = ATNDeserializer.toInt32(data, offset);
    var high = ATNDeserializer.toInt32(data, offset + 2);
    return (low & 0x00000000FFFFFFFF) | (high << 32);
};

/**
 * @param {Array<number>} data
 * @param {number} offset
 * @return {string}
 */
ATNDeserializer.toUUID = function (data, offset) {
    var bb = [];
    for (var i = 7; i >= 0; i--) {
        var int = data[offset++];
        bb[(2*i)+1] = int & 0xFF;
        bb[2*i] = (int >> 8) & 0xFF;
    }
    return BYTE_HEX[bb[0]] + BYTE_HEX[bb[1]] +
    BYTE_HEX[bb[2]] + BYTE_HEX[bb[3]] + '-' +
    BYTE_HEX[bb[4]] + BYTE_HEX[bb[5]] + '-' +
    BYTE_HEX[bb[6]] + BYTE_HEX[bb[7]] + '-' +
    BYTE_HEX[bb[8]] + BYTE_HEX[bb[9]] + '-' +
    BYTE_HEX[bb[10]] + BYTE_HEX[bb[11]] +
    BYTE_HEX[bb[12]] + BYTE_HEX[bb[13]] +
    BYTE_HEX[bb[14]] + BYTE_HEX[bb[15]];
};


exports = ATNDeserializer;
