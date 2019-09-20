/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.RuleTransition');


const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');

class RuleTransition extends Transition {
    /**
     * @param {org.antlr.v4.runtime.atn.RuleStartState} ruleStart
     * @param {number} ruleIndex
     * @param {number} precedence
     * @param {org.antlr.v4.runtime.atn.ATNState} followState
     */
	constructor(ruleStart, ruleIndex, precedence, followState) {
        super(ruleStart);
        /**
         * Ptr to the rule definition object for this rule ref
         *
         * @type {number}
         */
        this.ruleIndex = ruleIndex;
        /**
         * @type {number}
         */
        this.precedence = precedence;
        /**
         * @type {org.antlr.v4.runtime.atn.ATNState}
         */
		this.followState = followState;
	}

	getSerializationType() {
		return Transition.RULE;
	}

	isEpsilon() {
        return true;
    }

	matches(symbol, minVocabSymbol, maxVocabSymbol) {
		return false;
    }
}

Transition.serializationTypes.set(RuleTransition, Transition.RULE);


exports = RuleTransition;
