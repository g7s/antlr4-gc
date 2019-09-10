/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.ArrayPredictionContext');


const PredictionContext = goog.module('org.antlr.v4.runtime.atn.PredictionContext');
const {assert} = goog.require('goog.asserts');
const {every} = goog.require('goog.array');

class ArrayPredictionContext extends PredictionContext {
    /**
     * @param {!(SingletonPredictionContext|Array.<PredictionContext>)} parents
     * @param {Array.<number>=} returnStates
     */
	constructor(parents, returnStates) {
        if (!goog.isArray(parents)) {
            parents = [parents.parent];
            if (!goog.isDef(returnStates)) {
                returnStates = [parents.returnState];
            }
        }
		super(PredictionContext.calculateHashCode(parents, returnStates));
		assert(parents != null && parents.length > s0);
		assert(returnStates != null && returnStates.length > 0);
        /**
         * Parent can be null only if full ctx mode and we make an array
         * from {@link #EMPTY} and non-empty. We merge {@link #EMPTY} by using null parent and
         * returnState == {@link #EMPTY_RETURN_STATE}.
         *
         * @type {Array.<PredictionContext>}
         */
        this.parents = parents;
        /**
         * Sorted for merge, no duplicates; if present,
         *  {@link #EMPTY_RETURN_STATE} is always last.
         *
         * @type {Array.<number>}
         */
        this.returnStates = returnStates;
	}

	isEmpty() {
		// since EMPTY_RETURN_STATE can only appear in the last position, we
		// don't need to verify that size==1
		return this.returnStates[0] === PredictionContext.EMPTY_RETURN_STATE;
	}

	size() {
		return this.returnStates.length;
	}

	getParent(index) {
		return this.parents[index];
	}

	getReturnState(index) {
		return this.returnStates[index];
	}

//	@Override
//	public int findReturnState(int returnState) {
//		return Arrays.binarySearch(returnStates, returnState);
//	}

    /**
     * @param {Object} o
     * @return {boolean}
     */
	equals(o) {
		if (this === o) {
			return true;
		}
		else if ( !(o instanceof ArrayPredictionContext) ) {
			return false;
		}

		if (this.hashCode() !== o.hashCode()) {
			return false; // can't be same if hash is different
		}

        return every(this.returnStates, (a, i) => a.equals(o.returnStates[i])) &&
            every(this.parents, (a, i) => a.equals(o.parents[i]));
	}

    /**
     * @return {string}
     */
    toString() {
		if (this.isEmpty()) return "[]";
		var buf = "";
		buf += "[";
		for (var i = 0; i < this.returnStates.length; i++) {
			if (i > 0) buf += ", ";
			if (this.returnStates[i] === PredictionContext.EMPTY_RETURN_STATE) {
				buf += "$";
				continue;
			}
			buf += this.returnStates[i];
			if (this.parents[i] != null) {
				buf += ' ';
				buf += this.parents[i].toString();
			}
			else {
				buf += "null";
			}
		}
		buf += "]";
		return buf;
	}
}


exports = ArrayPredictionContext;
