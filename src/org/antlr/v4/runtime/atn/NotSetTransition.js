/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.NotSetTransition');
goog.module.declareLegacyNamespace();


const SetTransition = goog.require('org.antlr.v4.runtime.atn.SetTransition');
const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');

class NotSetTransition extends SetTransition {
    /**
     * @param {org.antlr.v4.runtime.atn.ATNState} target
     * @param {org.antlr.v4.runtime.misc.IntervalSet} set
     */
    constructor(target, set) {
        super(target, set);
    }

    getSerializationType() {
        return Transition.NOT_SET;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return symbol >= minVocabSymbol
            && symbol <= maxVocabSymbol
            && !super.matches(symbol, minVocabSymbol, maxVocabSymbol);
    }

    /**
     * @return {string}
     */
    toString() {
        return '~' + super.toString();
    }
}


exports = NotSetTransition;
