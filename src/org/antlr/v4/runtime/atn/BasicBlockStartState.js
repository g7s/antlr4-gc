/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.BasicBlockStartState');


const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');
const BlockStartState = goog.require('org.antlr.v4.runtime.atn.BlockStartState');

/**
 *
 * @author Sam Harwell
 */
class BasicBlockStartState extends BlockStartState {
	getStateType() {
		return ATNState.BLOCK_START;
	}
}


exports = BasicBlockStartState;
