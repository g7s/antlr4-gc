/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.misc.Pair');


const {format} = goog.require('goog.string');

/**
 * @template A, B
 */
class Pair {
    /**
     * @param {A} a
     * @param {B} b
     */
	constructor(a, b) {
        /**
         * @type {A}
         */
        this.a = a;
        /**
         * @type {B}
         */
		this.b = b;
	}

    /**
     * @return {string}
     */
	toString() {
		return format("(%s, %s)", this.a, this.b);
	}
}


exports = Pair;
