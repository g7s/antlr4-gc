/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.InputMismatchException');


const RecognitionException = goog.require('org.antlr.v4.runtime.RecognitionException');

/**
 * This signifies any kind of mismatched input exceptions such as
 * when the current input does not match the expected token.
 */
class InputMismatchException extends RecognitionException {
    /**
     * @param {org.antlr.v4.runtime.Parser} recognizer
     * @param {number=} state
     * @param {org.antlr.v4.runtime.ParserRuleContext=} ctx
     */
	constructor(recognizer, state, ctx) {
		super("", recognizer, recognizer.getInputStream(), ctx || recognizer.getContext());
		if (state) this.setOffendingState(state);
		this.setOffendingToken(recognizer.getCurrentToken());
	}
};


exports = InputMismatchException;