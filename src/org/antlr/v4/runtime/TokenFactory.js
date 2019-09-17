/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.TokenFactory');


/**
 * The default mechanism for creating tokens. It's used by default in Lexer and
 * the error handling strategy (to create missing tokens).  Notifying the parser
 * of a new factory means that it notifies its token source and error strategy.
 *
 * @interface
 * @template T
 */
class TokenFactory {
	/**
     * This is the method used to create tokens in the lexer and in the
	 * error handling strategy. If text!=null, than the start and stop positions
	 * are wiped to -1 in the text override is set in the CommonToken.
     *
     * @param {!org.antlr.v4.runtime.misc.Pair<org.antlr.v4.runtime.TokenSource, org.antlr.v4.runtime.CharStream>} source
     * @param {number} type
     * @param {string} text
     * @param {number} channel
     * @param {number} start
     * @param {number} stop
     * @param {number} line
     * @param {number} charPositionInLine
     * @return {T}
	 */
	create(source, type, text, channel, start, stop, line, charPositionInLine) {}
};


exports = TokenFactory;
