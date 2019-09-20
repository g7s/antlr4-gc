/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.dfa.DFA');


const DFASerializer = goog.require('org.antlr.v4.runtime.dfa.DFASerializer');
const LexerDFASerializer = goog.require('org.antlr.v4.runtime.dfa.LexerDFASerializer');
const VocabularyImpl = goog.require('org.antlr.v4.runtime.VocabularyImpl');
const DFAState = goog.require('org.antlr.v4.runtime.dfa.DFAState');
const ATNConfigSet = goog.require('org.antlr.v4.runtime.atn.ATNConfigSet');
const StarLoopEntryState = goog.require('org.antlr.v4.runtime.atn.StarLoopEntryState');
const Map = goog.require('org.antlr.v4.runtime.misc.Map');
const {sort} = goog.require('goog.array');

class DFA {
    /**
     * @param {org.antlr.v4.runtime.atn.DecisionState} atnStartState
     * @param {number=} decision
     */
    constructor(atnStartState, decision) {
        /**
         * A set of all DFA states. Use {@link Map} so we can get old state back
         * ({@link Set} only allows you to see if it's there).
         *
         * @type {Map<DFAState, DFAState>}
         */
        this.states = new Map();
        /**
         * From which ATN state did we create this DFA?
         * @type {org.antlr.v4.runtime.atn.DecisionState}
         */
        this.atnStartState = atnStartState;
        /**
         * @type {number}
         */
		this.decision = decision || 0;
		var precedenceDfa = false;
		if (atnStartState instanceof StarLoopEntryState) {
			if (atnStartState.isPrecedenceDecision) {
				precedenceDfa = true;
                var precedenceState = new DFAState(new ATNConfigSet());
                /**
                 * @type {Array<DFAState>}
                 */
				precedenceState.edges = [];
				precedenceState.isAcceptState = false;
				precedenceState.requiresFullContext = false;
				this.s0 = precedenceState;
			}
		}
        /**
         * @type {boolean}
         */
		this.precedenceDfa = precedenceDfa;
    }

    /**
     * Gets whether this DFA is a precedence DFA. Precedence DFAs use a special
     * start state {@link #s0} which is not stored in {@link #states}. The
     * {@link DFAState#edges} array for this start state contains outgoing edges
     * supplying individual start states corresponding to specific precedence
     * values.
     *
     * @return {boolean} {@code true} if this is a precedence DFA; otherwise,
     * {@code false}.
     * @see Parser#getPrecedence()
     */
    isPrecedenceDfa() {
        return this.precedenceDfa;
    }

    /**
     * Get the start state for a specific precedence value.
     *
     * @param {number} precedence The current precedence.
     * @return {DFAState} The start state corresponding to the specified precedence, or
     * {@code null} if no start state exists for the specified precedence.
     *
     * @throws {Error} IllegalStateException if this is not a precedence DFA.
     * @see #isPrecedenceDfa()
     */
    getPrecedenceStartState(precedence) {
        if (!this.isPrecedenceDfa()) {
            throw new Error("Only precedence DFAs may contain a precedence start state.");
        }
        // s0.edges is never null for a precedence DFA
        if (precedence < 0 || precedence >= this.s0.edges.length) {
            return null;
        }
        return this.s0.edges[precedence];
    }

    /**
     * Set the start state for a specific precedence value.
     *
     * @param {number} precedence The current precedence.
     * @param {DFAState} startState The start state corresponding to the specified
     * precedence.
     * @return {void}
     *
     * @throws {Error} IllegalStateException if this is not a precedence DFA.
     * @see #isPrecedenceDfa()
     */
    setPrecedenceStartState(precedence, startState) {
        if (!this.isPrecedenceDfa()) {
            throw new Error("Only precedence DFAs may contain a precedence start state.");
        }
        if (precedence < 0) {
            return;
        }
        // synchronization on s0 here is ok. when the DFA is turned into a
        // precedence DFA, s0 will be initialized once and not updated again
        // s0.edges is never null for a precedence DFA
        // if (precedence >= this.s0.edges.length) {
        //     this.s0.edges = Arrays.copyOf(this.s0.edges, precedence + 1);
        // }
        this.s0.edges[precedence] = startState;
    }

    /**
     * Return a list of all states in this DFA, ordered by state number.
     *
     * @return {!Array<DFAState>}
     */
    getStates() {
        let sorted = Array.from(this.states.keys());
        sort(sorted, (o1, o2) => o1.stateNumber - o2.stateNumber);
        return sorted;
    }

    /**
     * @param {org.antlr.v4.runtime.Vocabulary=} vocabulary
     * @return {string}
     */
    toString(vocabulary) {
        if (this.s0 == null) {
            return "";
        }
        vocabulary = vocabulary || VocabularyImpl.EMPTY_VOCABULARY;
        var serializer = new DFASerializer(this, vocabulary);
        return serializer.toString();
    }

    /**
     * @return {string}
     */
    toLexerString() {
        if (this.s0 == null) return "";
        var serializer = new LexerDFASerializer(this);
        return serializer.toString();
    }
}


exports = DFA;
