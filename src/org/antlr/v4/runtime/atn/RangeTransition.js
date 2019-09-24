/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.RangeTransition');
goog.module.declareLegacyNamespace();


const IntervalSet = goog.require('org.antlr.v4.runtime.misc.IntervalSet');
const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');

class RangeTransition extends Transition {
    /**
     * @param {org.antlr.v4.runtime.atn.ATNState} target
     * @param {number} from
     * @param {number} to
     */
	constructor(target, from, to) {
        super(target);
        /**
         * @type {number}
         */
        this.from = from;
        /**
         * @type {number}
         */
		this.to = to;
	}

	getSerializationType() {
		return Transition.RANGE;
	}

	label() {
        return IntervalSet.of(this.from, this.to);
    }

	matches(symbol, minVocabSymbol, maxVocabSymbol) {
		return symbol >= this.from && symbol <= this.to;
	}

    /**
     * @return {string}
     */
	toString() {
        return "'" + String.fromCodePoint(this.from) + ".." + String.fromCodePoint(this.to) + "'";
	}
}

Transition.serializationTypes.set(RangeTransition, Transition.RANGE);


exports = RangeTransition;
