/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.EpsilonTransition');
goog.module.declareLegacyNamespace();


const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');

class EpsilonTransition extends Transition {
    /**
     * @param {org.antlr.v4.runtime.atn.ATNState} target
     * @param {number=} outermostPrecedenceReturn
     */
	constructor(target, outermostPrecedenceReturn) {
        super(target);
        /**
         * @private {number}
         */
		this._outermostPrecedenceReturn = goog.isDef(outermostPrecedenceReturn) ? outermostPrecedenceReturn : -1;
	}

	/**
	 * @return {number} the rule index of a precedence rule for which this transition is
	 * returning from, where the precedence value is 0; otherwise, -1.
	 *
	 * @see ATNConfig#isPrecedenceFilterSuppressed()
	 * @see ParserATNSimulator#applyPrecedenceFilter(ATNConfigSet)
	 * @since 4.4.1
	 */
	outermostPrecedenceReturn() {
		return this._outermostPrecedenceReturn;
	}

	getSerializationType() {
		return Transition.EPSILON;
	}

	isEpsilon() {
        return true;
    }

	matches(symbol, minVocabSymbol, maxVocabSymbol) {
		return false;
	}

    /**
     * @return {string}
     */
	toString() {
		return "epsilon";
	}
}


exports = EpsilonTransition;
