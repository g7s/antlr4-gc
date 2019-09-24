/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.WritableToken');
goog.module.declareLegacyNamespace();


const Token = goog.require('org.antlr.v4.runtime.Token');

/**
 * @interface
 */
class WritableToken extends Token {
    /**
     * @param {string} text
     * @return {void}
     */
	setText(text) {}

    /**
     * @param {number} ttype
     * @return {void}
     */
	setType(ttype) {}

    /**
     * @param {number} line
     * @return {void}
     */
	setLine(line) {}

    /**
     * @param {number} pos
     * @return {void}
     */
	setCharPositionInLine(pos) {}

    /**
     * @param {number} channel
     * @return {void}
     */
	setChannel(channel) {}

    /**
     * @param {number} index
     * @return {void}
     */
	setTokenIndex(index) {}
};


exports = WritableToken;
