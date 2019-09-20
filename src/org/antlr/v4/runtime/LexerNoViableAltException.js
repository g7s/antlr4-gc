/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.LexerNoViableAltException');


const RecognitionException = goog.require('org.antlr.v4.runtime.RecognitionException');
const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');
const {escapeWhitespace} = goog.require('org.antlr.v4.runtime.misc.Utils');
const {format} = goog.require('goog.string');

class LexerNoViableAltException extends RecognitionException {
    /**
     * @param {org.antlr.v4.runtime.Lexer} lexer
     * @param {org.antlr.v4.runtime.CharStream} input
     * @param {number} startIndex
     * @param {org.antlr.v4.runtime.atn.ATNConfigSet} deadEndConfigs
     */
    constructor(lexer, input, startIndex, deadEndConfigs) {
        super("", lexer, input, null);
        /**
         * Matching attempted at what input index?
         *
         * @private {number}
         */
        this.startIndex = startIndex;
        /**
         * Which configurations did we try at input.index() that couldn't match input.LA(1)?
         *
         * @private {org.antlr.v4.runtime.atn.ATNConfigSet}
         */
        this.deadEndConfigs = deadEndConfigs;
    }

    /**
     * @return {number}
     */
    getStartIndex() {
        return this.startIndex;
    }

    /**
     * @return {org.antlr.v4.runtime.atn.ATNConfigSet}
     */
    getDeadEndConfigs() {
        return this.deadEndConfigs;
    }

    /**
     * @return {org.antlr.v4.runtime.CharStream}
     */
    getInputStream() {
        return /** @type {org.antlr.v4.runtime.CharStream} */ (super.getInputStream());
    }

    /**
     * @return {string}
     */
    toString() {
        var symbol = "";
        if (this.startIndex >= 0 && this.startIndex < this.getInputStream().size()) {
            symbol = this.getInputStream().getText(Interval.of(this.startIndex, this.startIndex));
            symbol = escapeWhitespace(symbol, false);
        }

        return format("LexerNoViableAltException('%s')", symbol);
    }
};


exports = LexerNoViableAltException;
