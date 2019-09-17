/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.NoViableAltException');


const RecognitionException = goog.require('org.antlr.v4.runtime.RecognitionException');

class NoViableAltException extends RecognitionException {
    /**
     * @param {org.antlr.v4.runtime.Parser} recognizer
     * @param {org.antlr.v4.runtime.TokenStream} input
     * @param {org.antlr.v4.runtime.Token} startToken
     * @param {org.antlr.v4.runtime.Token} offendingToken
     * @param {org.antlr.v4.runtime.atn.ATNConfigSet} deadEndConfigs
     * @param {org.antlr.v4.runtime.ParserRuleContext} ctx
     */
    constructor(recognizer, input, startToken, offendingToken, deadEndConfigs, ctx) {
        input = input || recognizer.getInputStream();
        startToken = startToken || recognizer.getCurrentToken();
        offendingToken = offendingToken || recognizer.getCurrentToken();
        deadEndConfigs = deadEndConfigs || null;
        ctx = ctx || recognizer.getContext();
        super(recognizer, input, ctx);
        /**
         * Which configurations did we try at input.index() that couldn't match input.LT(1)?
         * @private {org.antlr.v4.runtime.atn.ATNConfigSet}
         */
        this.deadEndConfigs = deadEndConfigs;
        /**
         * The token object at the start index; the input stream might
         * not be buffering tokens so get a reference to it. (At the
         * time the error occurred, of course the stream needs to keep a
         * buffer all of the tokens but later we might not have access to those.)
         * @private {org.antlr.v4.runtime.Token}
         */
        this.startToken = startToken;

        this.setOffendingToken(offendingToken);
    }

    /**
     * @return {org.antlr.v4.runtime.Token}
     */
    getStartToken() {
        return this.startToken;
    }

    /**
     * @return {org.antlr.v4.runtime.atn.ATNConfigSet}
     */
    getDeadEndConfigs() {
        return this.deadEndConfigs;
    }
};


exports = NoViableAltException;
