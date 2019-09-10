/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.EmptyPredictionContext');


const PredictionContext = goog.module('org.antlr.v4.runtime.atn.PredictionContext');
const SingletonPredictionContext = goog.module('org.antlr.v4.runtime.atn.SingletonPredictionContext');

class EmptyPredictionContext extends SingletonPredictionContext {
	constructor() {
		super(null, PredictionContext.EMPTY_RETURN_STATE);
	}

	isEmpty() {
        return true;
    }

	size() {
		return 1;
	}

	getParent(index) {
		return null;
	}

	getReturnState(index) {
		return this.returnState;
	}

    /**
     * @param {Object} o
     * @return {boolean}
     */
	equals(o) {
		return this === o;
	}

    /**
     * @return {string}
     */
	toString() {
		return "$";
	}
}


exports = EmptyPredictionContext;
