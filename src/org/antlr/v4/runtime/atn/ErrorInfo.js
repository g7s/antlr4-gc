/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.ErrorInfo');


const DecisionEventInfo = goog.require('org.antlr.v4.runtime.atn.DecisionEventInfo');

/**
 * This class represents profiling event information for a syntax error
 * identified during prediction. Syntax errors occur when the prediction
 * algorithm is unable to identify an alternative which would lead to a
 * successful parse.
 *
 * @see Parser#notifyErrorListeners(Token, String, RecognitionException)
 * @see ANTLRErrorListener#syntaxError
 *
 * @since 4.3
 */
class ErrorInfo extends DecisionEventInfo {
	/**
	 * Constructs a new instance of the {@link ErrorInfo} class with the
	 * specified detailed syntax error information.
	 *
	 * @param {number} decision The decision number
	 * @param {org.antlr.v4.runtime.atn.ATNConfigSet} configs The final
     * configuration set reached during prediction prior to reaching the
     * {@link ATNSimulator#ERROR} state
	 * @param {org.antlr.v4.runtime.TokenStream} input The input token stream
	 * @param {number} startIndex The start index for the current prediction
	 * @param {number} stopIndex The index at which the syntax error was identified
	 * @param {boolean} fullCtx {@code true} if the syntax error was identified during LL
	 * prediction; otherwise, {@code false} if the syntax error was identified
	 * during SLL prediction
	 */
	constructor(decision, configs, input, startIndex, stopIndex, fullCtx) {
		super(decision, configs, input, startIndex, stopIndex, fullCtx);
	}
}


exports = ErrorInfo;
