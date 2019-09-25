/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.PredicateTransition');
goog.module.declareLegacyNamespace();


const AbstractPredicateTransition = goog.require('org.antlr.v4.runtime.atn.AbstractPredicateTransition');
const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');
const SemanticContext = goog.require('org.antlr.v4.runtime.atn.SemanticContext');

/** TODO: this is old comment:
 *  A tree of semantic predicates from the grammar AST if label==SEMPRED.
 *  In the ATN, labels will always be exactly one predicate, but the DFA
 *  may have to combine a bunch of them as it collects predicates from
 *  multiple ATN configurations into a single DFA state.
 */
class PredicateTransition extends AbstractPredicateTransition {
    /**
     * @param {org.antlr.v4.runtime.atn.ATNState} target
     * @param {number} ruleIndex
     * @param {number} predIndex
     * @param {boolean} isCtxDependent
     */
    constructor(target, ruleIndex, predIndex, isCtxDependent) {
        super(target);
        /**
         * @type {number}
         */
        this.ruleIndex = ruleIndex;
        /**
         * @type {number}
         */
        this.predIndex = predIndex;
        /**
         * @type {boolean}
         */
        this.isCtxDependent = isCtxDependent;
    }

    getSerializationType() {
        return Transition.PREDICATE;
    }

    isEpsilon() {
        return true;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    }

    /**
     * @return {SemanticContext.Predicate}
     */
    getPredicate() {
           return new SemanticContext.Predicate(this.ruleIndex, this.predIndex, this.isCtxDependent);
       }

    /**
     * @return {string}
     */
    toString() {
        return "pred_" + this.ruleIndex + ":" + this.predIndex;
    }
}


exports = PredicateTransition;
