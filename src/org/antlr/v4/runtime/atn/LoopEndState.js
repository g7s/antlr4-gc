
/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LoopEndState');


const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');

/**
 * Mark the end of a * or + loop.
 */
class LoopEndState extends ATNState {
    constructor() {
        super();
        /**
         * @type {ATNState}
         */
        this.loopBackState = null;
    }

	getStateType() {
		return ATNState.LOOP_END;
	}
}


exports = LoopEndState;
