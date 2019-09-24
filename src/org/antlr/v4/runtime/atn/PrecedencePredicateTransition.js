/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.PrecedencePredicateTransition');
goog.module.declareLegacyNamespace();


const AbstractPredicateTransition = goog.require('org.antlr.v4.runtime.atn.AbstractPredicateTransition');
const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');
const SemanticContext = goog.require('org.antlr.v4.runtime.atn.SemanticContext');

/**
 *
 * @author Sam Harwell
 */
class PrecedencePredicateTransition extends AbstractPredicateTransition {
    /**
     * @param {org.antlr.v4.runtime.atn.ATNState} target
     * @param {number} precedence
     */
    constructor(target, precedence) {
        super(target);
        /**
         * @type {number}
         */
		this.precedence = precedence;
	}

	getSerializationType() {
		return Transition.PRECEDENCE;
	}

	isEpsilon() {
		return true;
	}

	matches(symbol, minVocabSymbol, maxVocabSymbol) {
		return false;
	}

    /**
     * @return {SemanticContext.PrecedencePredicate}
     */
	getPredicate() {
		return new SemanticContext.PrecedencePredicate(this.precedence);
	}

    /**
     * @return {string}
     */
	toString() {
		return this.precedence + " >= _p";
	}

}


exports = PrecedencePredicateTransition;
