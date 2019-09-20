/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.ATNState');


const {format} = goog.require('goog.string');

/**
 * The following images show the relation of states and
 * {@link ATNState#transitions} for various grammar constructs.
 *
 * <ul>
 *
 * <li>Solid edges marked with an &#0949; indicate a required
 * {@link EpsilonTransition}.</li>
 *
 * <li>Dashed edges indicate locations where any transition derived from
 * {@link Transition} might appear.</li>
 *
 * <li>Dashed nodes are place holders for either a sequence of linked
 * {@link BasicState} states or the inclusion of a block representing a nested
 * construct in one of the forms below.</li>
 *
 * <li>Nodes showing multiple outgoing alternatives with a {@code ...} support
 * any number of alternatives (one or more). Nodes without the {@code ...} only
 * support the exact number of alternatives shown in the diagram.</li>
 *
 * </ul>
 *
 * <h2>Basic Blocks</h2>
 *
 * <h3>Rule</h3>
 *
 * <embed src="images/Rule.svg" type="image/svg+xml"/>
 *
 * <h3>Block of 1 or more alternatives</h3>
 *
 * <embed src="images/Block.svg" type="image/svg+xml"/>
 *
 * <h2>Greedy Loops</h2>
 *
 * <h3>Greedy Closure: {@code (...)*}</h3>
 *
 * <embed src="images/ClosureGreedy.svg" type="image/svg+xml"/>
 *
 * <h3>Greedy Positive Closure: {@code (...)+}</h3>
 *
 * <embed src="images/PositiveClosureGreedy.svg" type="image/svg+xml"/>
 *
 * <h3>Greedy Optional: {@code (...)?}</h3>
 *
 * <embed src="images/OptionalGreedy.svg" type="image/svg+xml"/>
 *
 * <h2>Non-Greedy Loops</h2>
 *
 * <h3>Non-Greedy Closure: {@code (...)*?}</h3>
 *
 * <embed src="images/ClosureNonGreedy.svg" type="image/svg+xml"/>
 *
 * <h3>Non-Greedy Positive Closure: {@code (...)+?}</h3>
 *
 * <embed src="images/PositiveClosureNonGreedy.svg" type="image/svg+xml"/>
 *
 * <h3>Non-Greedy Optional: {@code (...)??}</h3>
 *
 * <embed src="images/OptionalNonGreedy.svg" type="image/svg+xml"/>
 *
 * @abstract
 */
class ATNState {
    constructor() {
        /**
         * Which ATN are we in?
         *
         * @type {org.antlr.v4.runtime.atn.ATN}
         */
        this.atn = null;
        /**
         * @type {number}
         */
        this.stateNumber = ATNState.INVALID_STATE_NUMBER;
        /**
         * @type {number}
         */
        this.ruleIndex = 0; // at runtime, we don't have Rule objects
        /**
         * @type {boolean}
         */
        this.epsilonOnlyTransitions = false;
        /**
         * Track the transitions emanating from this ATN state.
         *
         * @protected {!Array<org.antlr.v4.runtime.atn.Transition>}
         */
        this.transitions = [];
        /**
         * Used to cache lookahead during parsing, not used during construction
         *
         * @type {org.antlr.v4.runtime.misc.IntervalSet}
         */
        this.nextTokenWithinRule = null;
    }

    /**
     * @return {number}
     */
	hashCode() {
        return this.stateNumber;
    }

    /**
     * @param {Object} o
     * @return {boolean}
     */
	equals(o) {
		// are these states same object?
		if (o instanceof ATNState) return this.stateNumber === o.stateNumber;
		return false;
	}

    /**
     * @return {boolean}
     */
	isNonGreedyExitState() {
		return false;
	}

    /**
     * @return {string}
     */
	toString() {
		return "" + this.stateNumber;
	}

    /**
     * @return {!Array<org.antlr.v4.runtime.atn.Transition>}
     */
	getTransitions() {
		return this.transitions;
	}

    /**
     * @return {number}
     */
	getNumberOfTransitions() {
		return this.transitions.length;
	}

    /**
     * @param {org.antlr.v4.runtime.atn.Transition} e
     * @param {number=} index
     * @return {void}
     */
	addTransition(e, index) {
        if (!goog.isDef(index)) index = this.transitions.length;
		if (this.transitions.length === 0) {
			this.epsilonOnlyTransitions = e.isEpsilon();
		}
		else if (this.epsilonOnlyTransitions !== e.isEpsilon()) {
            console.error(format("ATN state %d has both epsilon and non-epsilon transitions.\n", this.stateNumber));
			this.epsilonOnlyTransitions = false;
		}

		var alreadyPresent = false;
		for (const t of this.transitions) {
			if (t.target.stateNumber === e.target.stateNumber) {
				if (t.label() != null && e.label() != null && t.label().equals(e.label()) ) {
//					System.err.println("Repeated transition upon "+e.label()+" from "+stateNumber+"->"+t.target.stateNumber);
					alreadyPresent = true;
					break;
				}
				else if (t.isEpsilon() && e.isEpsilon()) {
//					System.err.println("Repeated epsilon transition from "+stateNumber+"->"+t.target.stateNumber);
					alreadyPresent = true;
					break;
				}
			}
		}
		if (!alreadyPresent) {
			this.transitions.splice(index, 0, e);
		}
	}

    /**
     * @param {number} i
     * @return {org.antlr.v4.runtime.atn.Transition}
     */
	transition(i) {
        return this.transitions[i];
    }

    /**
     * @param {number} i
     * @param {org.antlr.v4.runtime.atn.Transition} e
     * @return {void}
     */
	setTransition(i, e) {
		this.transitions[i] = e;
	}

    /**
     * @param {number} index
     * @return {org.antlr.v4.runtime.atn.Transition}
     */
	removeTransition(index) {
        var e = this.transitions[index];
        delete this.transitions[index];
        return e;
	}

    /**
     * @abstract
     * @return {number}
     */
	getStateType() {}

    /**
     * @return {boolean}
     */
	onlyHasEpsilonTransitions() {
		return this.epsilonOnlyTransitions;
	}

    /**
     * @param {number} ruleIndex
     * @return {void}
     */
	setRuleIndex(ruleIndex) {
        this.ruleIndex = ruleIndex;
    }
}

/**
 * @type {number}
 */
ATNState.INITIAL_NUM_TRANSITIONS = 4;
/**
 * @type {number}
 */
ATNState.INVALID_TYPE = 0;
/**
 * @type {number}
 */
ATNState.BASIC = 1;
/**
 * @type {number}
 */
ATNState.RULE_START = 2;
/**
 * @type {number}
 */
ATNState.BLOCK_START = 3;
/**
 * @type {number}
 */
ATNState.PLUS_BLOCK_START = 4;
/**
 * @type {number}
 */
ATNState.STAR_BLOCK_START = 5;
/**
 * @type {number}
 */
ATNState.TOKEN_START = 6;
/**
 * @type {number}
 */
ATNState.RULE_STOP = 7;
/**
 * @type {number}
 */
ATNState.BLOCK_END = 8;
/**
 * @type {number}
 */
ATNState.STAR_LOOP_BACK = 9;
/**
 * @type {number}
 */
ATNState.STAR_LOOP_ENTRY = 10;
/**
 * @type {number}
 */
ATNState.PLUS_LOOP_BACK = 11;
/**
 * @type {number}
 */
ATNState.LOOP_END = 12;
/**
 * @type {Array<string>}
 */
ATNState.serializationNames = [
    "INVALID",
    "BASIC",
    "RULE_START",
    "BLOCK_START",
    "PLUS_BLOCK_START",
    "STAR_BLOCK_START",
    "TOKEN_START",
    "RULE_STOP",
    "BLOCK_END",
    "STAR_LOOP_BACK",
    "STAR_LOOP_ENTRY",
    "PLUS_LOOP_BACK",
    "LOOP_END"
];
/**
 * @type {number}
 */
ATNState.INVALID_STATE_NUMBER = -1;


exports = ATNState;
