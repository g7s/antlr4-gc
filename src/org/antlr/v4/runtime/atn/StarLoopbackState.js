/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.StarLoopbackState');


const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');

class StarLoopbackState extends ATNState {
    /**
     * @return {org.antlr.v4.runtime.atn.StarLoopEntryState}
     */
	getLoopEntryState() {
		return this.transition(0).target;
	}

	getStateType() {
		return ATNState.STAR_LOOP_BACK;
	}
}


exports = StarLoopbackState;
