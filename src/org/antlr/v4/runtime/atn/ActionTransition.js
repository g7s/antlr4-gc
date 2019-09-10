/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.ActionTransition');


const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');

class ActionTransition extends Transition {
	constructor(target, ruleIndex, actionIndex, isCtxDependent) {
        super(target);
        /**
         * @type {number}
         */
        this.ruleIndex = ruleIndex;
        /**
         * @type {number}
         */
        this.actionIndex = goog.isDef(actionIndex) ? actionIndex : -1;
        /**
         * @type {boolean}
         */
		this.isCtxDependent = goog.isDef(isCtxDependent) ? isCtxDependent : false;
	}

	getSerializationType() {
		return Transition.ACTION;
	}

	isEpsilon() {
		return true; // we are to be ignored by analysis 'cept for predicates
	}

	matches(symbol, minVocabSymbol, maxVocabSymbol) {
		return false;
	}

    /**
     * @return {string}
     */
	toString() {
		return "action_" + this.ruleIndex + ":" + this.actionIndex;
	}
}


exports = ActionTransition;
