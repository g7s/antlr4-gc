/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.SetTransition');
goog.module.declareLegacyNamespace();


const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');
const Token = goog.require('org.antlr.v4.runtime.Token');
const IntervalSet = goog.require('org.antlr.v4.runtime.misc.IntervalSet');

/**
 * A transition containing a set of values.
 */
class SetTransition extends Transition {
    // TODO (sam): should we really allow null here?
    /**
     * @param {org.antlr.v4.runtime.atn.ATNState} target
     * @param {IntervalSet} set
     */
    constructor(target, set) {
        super(target);
        if (set == null) set = IntervalSet.of(Token.INVALID_TYPE);
        /**
         * @type {IntervalSet}
         */
        this.set = set;
    }

    getSerializationType() {
        return Transition.SET;
    }

    label() {
        return this.set;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return this.set.contains(symbol);
    }

    /**
     * @return {string}
     */
    toString() {
        return this.set.toString();
    }
}

Transition.serializationTypes.set(SetTransition, Transition.SET);


exports = SetTransition;
