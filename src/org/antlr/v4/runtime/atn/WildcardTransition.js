/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.WildcardTransition');


const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');

class WildcardTransition extends Transition {
    /**
     * @param {org.antlr.v4.runtime.atn.ATNState} target
     */
	constructor(target) { super(target); }

	getSerializationType() {
		return Transition.WILDCARD;
	}

	matches(symbol, minVocabSymbol, maxVocabSymbol) {
		return symbol >= minVocabSymbol && symbol <= maxVocabSymbol;
	}

    /**
     * @return {string}
     */
	toString() {
		return ".";
	}
}

Transition.serializationTypes.set(WildcardTransition, Transition.WILDCARD);


exports = WildcardTransition;
