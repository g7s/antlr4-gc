/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.dfa.PredPrediction');
goog.module.declareLegacyNamespace();


/**
 * Map a predicate to a predicted alternative.
 */
class PredPrediction {
    /**
     * @param {org.antlr.v4.runtime.atn.SemanticContext} pred
     * @param {number} alt
     */
    constructor(pred, alt) {
        /**
         * @type {number}
         */
        this.alt = alt;
        /**
         * never null; at least SemanticContext.NONE
         * @type {org.antlr.v4.runtime.atn.SemanticContext}
         */
        this.pred = pred;
    }

    /**
     * @return {string}
     */
    toString() {
        return "(" + this.pred + ", " + this.alt + ")";
    }
}


exports = PredPrediction;
