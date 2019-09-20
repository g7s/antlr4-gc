/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.TokensStartState');


const DecisionState = goog.require('org.antlr.v4.runtime.atn.DecisionState');
const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');

/**
 * The Tokens rule start state linking to each lexer rule start state
 */
class TokensStartState extends DecisionState {
    getStateType() {
		return ATNState.TOKEN_START;
	}
}


exports = TokensStartState;
