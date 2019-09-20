/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.misc.MurmurHash');

/**
 *
 * @author Sam Harwell
 */
const MurmurHash = {
	/**
	 * Initialize the hash using the specified {@code seed}.
	 *
	 * @param {number=} seed the seed
	 * @return {number} the intermediate hash value
	 */
	initialize(seed) {
		return seed || MurmurHash.DEFAULT_SEED;
	},

	/**
	 * Update the intermediate hash value for the next input {@code value}.
	 *
	 * @param {number} hash the intermediate hash value
	 * @param {number|Object} value the value to add to the current hash
	 * @return {number} the updated intermediate hash value
	 */
	update(hash, value) {
		var c1 = 0xCC9E2D51;
		var c2 = 0x1B873593;
		var r1 = 15;
		var r2 = 13;
		var m = 5;
		var n = 0xE6546B64;

		var k = (goog.isObject(value) ? value.hashCode() : (value || 0));
		k = k * c1;
		k = (k << r1) | (k >>> (32 - r1));
		k = k * c2;

		hash = hash ^ k;
		hash = (hash << r2) | (hash >>> (32 - r2));
		hash = hash * m + n;

		return hash;
	},

	/**
	 * Apply the final computation steps to the intermediate value {@code hash}
	 * to form the final result of the MurmurHash 3 hash function.
	 *
	 * @param {number} hash the intermediate hash value
	 * @param {number} numberOfWords the number of integer values added to the hash
	 * @return {number} the final hash result
	 */
	finish(hash, numberOfWords) {
		hash = hash ^ (numberOfWords * 4);
		hash = hash ^ (hash >>> 16);
		hash = hash * 0x85EBCA6B;
		hash = hash ^ (hash >>> 13);
		hash = hash * 0xC2B2AE35;
		hash = hash ^ (hash >>> 16);
		return hash;
	},

	/**
	 * Utility function to compute the hash code of an array using the
	 * MurmurHash algorithm.
	 *
     * @template T
	 * @param {Array<T>} data the array data
	 * @param {number} seed the seed for the MurmurHash algorithm
	 * @return {number} the hash code of the data
	 */
	hashCode(data, seed) {
        var hash = MurmurHash.initialize(seed);
        data.forEach(value => {
            hash = MurmurHash.update(hash, value);
        });
		hash = MurmurHash.finish(hash, data.length);
		return hash;
	}
};

/**
 * @private {number}
 */
MurmurHash.DEFAULT_SEED = 0;


exports = MurmurHash;
