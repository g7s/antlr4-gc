/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.FailedPredicateException');


const RecognitionException = goog.require('org.antlr.v4.runtime.RecognitionException');
const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');
const AbstractPredicateTransition = goog.require('org.antlr.v4.runtime.atn.AbstractPredicateTransition');
const PredicateTransition = goog.require('org.antlr.v4.runtime.atn.PredicateTransition');
const {format} = goog.require('goog.string');

/**
 * A semantic predicate failed during validation.  Validation of predicates
 * occurs when normally parsing the alternative just like matching a token.
 * Disambiguating predicate evaluation occurs when we test a predicate during
 * prediction.
 */
class FailedPredicateException extends RecognitionException {
    /**
     * @param {org.antlr.v4.runtime.Parser} recognizer
     * @param {?string} predicate
     * @param {?string} message
     */
    constructor(recognizer, predicate, message) {
        super(FailedPredicateException.formatMessage(predicate, message),
            recognizer, recognizer.getInputStream(), recognizer._ctx);
        var s = recognizer.getInterpreter().atn.states.get(recognizer.getState());

        var trans = s.transition(0);
        if (trans instanceof PredicateTransition) {
            /**
             * @private {number}
             */
            this.ruleIndex = trans.ruleIndex;
            /**
             * @private {number}
             */
            this.predicateIndex = trans.predIndex;
        }
        else {
            /**
            * @private {number}
            */
            this.ruleIndex = 0;
            /**
             * @private {number}
             */
            this.predicateIndex = 0;
        }
        /**
         * @private {?string}
         */
        this.predicate = predicate;
        this.setOffendingToken(recognizer.getCurrentToken());
    }

    /**
     * @return {number}
     */
    getRuleIndex() {
        return this.ruleIndex;
    }

    /**
     * @return {number}
     */
    getPredIndex() {
        return this.predicateIndex;
    }

    /**
     * @return {string}
     */
    getPredicate() {
        return this.predicate;
    }
};

/**
 * @param {?string} predicate
 * @param {?string} message
 * @return {string}
 */
FailedPredicateException.formatMessage = function(predicate, message) {
    if (message != null) {
        return message;
    }

    return format("failed predicate: {%s}?", predicate);
};


exports = FailedPredicateException;
