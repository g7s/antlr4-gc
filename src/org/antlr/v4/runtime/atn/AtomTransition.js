/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.AtomTransition');


const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');
const IntervalSet = goog.require('org.antlr.v4.runtime.misc.IntervalSet');

/**
 * TODO: make all transitions sets? no, should remove set edges
 */
class AtomTransition extends Transition {
    /**
     * @param {org.antlr.v4.runtime.atn.ATNState} target
     * @param {number} label
     */
	constructor(target, label) {
        super(target);
        /**
         * The token type or character value; or, signifies special label.
         *
         * @type {number}
         */
		this.tlabel = label;
	}

	getSerializationType() {
		return Transition.ATOM;
	}

	label() {
        return IntervalSet.of(this.tlabel);
    }

	matches(symbol, minVocabSymbol, maxVocabSymbol) {
		return this.tlabel === symbol;
	}

    /**
     * @return {string}
     */
	toString() {
		return "" + this.tlabel;
	}
}


exports = AtomTransition;
