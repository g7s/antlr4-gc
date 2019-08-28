/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.SingletonPredictionContext');


const PredictionContext = goog.require('org.antlr.v4.runtime.atn.PredictionContext');
const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');

class SingletonPredictionContext extends PredictionContext {
    /**
     * @param {PredictionContext} parent
     * @param {number} returnState
     */
	constructor(parent, returnState) {
		super(parent != null ? this.calculateHashCode(parent, returnState) : this.calculateEmptyHashCode());
		if (returnState === ATNState.INVALID_STATE_NUMBER) {
            throw new Error('wrong argument');
        }
        /**
         * @type {PredictionContext}
         */
        this.parent = parent;
        /**
         * @param {number}
         */
		this.returnState = returnState;
	}

	size() {
		return 1;
	}

	getParent(index) {
		if (index !== 0) {
            throw new Error('wrong argument');
        }
		return this.parent;
	}

	getReturnState(index) {
        if (index !== 0) {
            throw new Error('wrong argument');
        }
		return this.returnState;
	}

	equals(o) {
		if (this === o) {
			return true;
		}
		else if ( !(o instanceof SingletonPredictionContext) ) {
			return false;
		}
		if (this.hashCode() !== o.hashCode()) {
			return false; // can't be same if hash is different
		}
		return this.returnState === s.returnState &&
			(this.parent != null && this.parent.equals(s.parent));
	}

    /**
     * @return {string}
     */
	toString() {
		var up = this.parent != null ? parent.toString() : "";
		if (up.length === 0) {
			if (this.returnState === PredictionContext.EMPTY_RETURN_STATE) {
				return "$";
			}
			return "" + this.returnState;
		}
		return this.returnState + " " + up;
	}
}

/**
 * @param {PredictionContext} parent
 * @param {number} returnState
 * @return {SingletonPredictionContext}
 */
SingletonPredictionContext.create = function (parent, returnState) {
    if (returnState === PredictionContext.EMPTY_RETURN_STATE && parent == null ) {
        // someone can pass in the bits of an array ctx that mean $
        return PredictionContext.EMPTY;
    }
    return new SingletonPredictionContext(parent, returnState);
};


exports = SingletonPredictionContext;
