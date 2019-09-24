/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.misc.Pair');
goog.module.declareLegacyNamespace();


const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');
const {format} = goog.require('goog.string');

/**
 * @param {Object} o1
 * @param {Object} o2
 * @return {boolean}
 */
const objectEquals = (o1, o2) => {
    return o1 === null ? o2 === null : o1.equals(o2);
};

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
     * @param {Object} obj
     * @return {boolean}
     */
    equals(obj) {
        if (obj === this) {
            return true;
        }
        else if (!(obj instanceof Pair)) {
            return false;
        }
        return objectEquals(this.a, obj.a) && objectEquals(this.b, obj.b);
    }

    /**
     * @return {number}
     */
    hashCode() {
        var hash = MurmurHash.initialize();
        hash = MurmurHash.update(hash, this.a);
        hash = MurmurHash.update(hash, this.b);
        return MurmurHash.finish(hash, 2);
    }

    /**
     * @return {string}
     */
	toString() {
		return format("(%s, %s)", this.a, this.b);
	}
}


exports = Pair;
