/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.RecognitionException');


const DecisionState = goog.require('org.antlr.v4.runtime.atn.DecisionState');
const IntervalSet = goog.require('org.antlr.v4.runtime.misc.IntervalSet');

/**
 * The root of the ANTLR exception hierarchy. In general, ANTLR tracks just
 * 3 kinds of errors: prediction errors, failed predicate errors, and
 * mismatched input errors. In each case, the parser knows where it is
 * in the input, where it is in the ATN, the rule invocation stack,
 * and what kind of problem occurred.
 */
class RecognitionException extends Error {
    /**
     * @param {string} message
     * @param {org.antlr.v4.runtime.Recognizer<?, ?>} recognizer
     * @param {org.antlr.v4.runtime.IntStream} input
     * @param {org.antlr.v4.runtime.ParserRuleContext} ctx
     */
    constructor(message, recognizer, input, ctx) {
        super(message);
        /**
         * The current {@link Token} when an error occurred. Since not all streams
         * support accessing symbols by index, we have to track the {@link Token}
         * instance itself.
         *
         * @private {org.antlr.v4.runtime.Token}
         */
        this.offendingToken = null;
        /**
         * @private {org.antlr.v4.runtime.Recognizer<?, ?>}
         */
        this.recognizer = recognizer;
        /**
         * @private {org.antlr.v4.runtime.IntStream}
         */
        this.input = input;
        /**
         * @private {org.antlr.v4.runtime.ParserRuleContext}
         */
        this.ctx = ctx;
        /**
         * @private {number}
         */
        this.offendingState = -1
        if (recognizer !== null) {
            this.offendingState = recognizer.getState();
        }
    }

    /**
     * Get the ATN state number the parser was in at the time the error
     * occurred. For {@link NoViableAltException} and
     * {@link LexerNoViableAltException} exceptions, this is the
     * {@link DecisionState} number. For others, it is the state whose outgoing
     * edge we couldn't match.
     *
     * <p>If the state number is not known, this method returns -1.</p>
     *
     * @return {number}
     */
    getOffendingState() {
        return this.offendingState;
    }

    /**
     * @param {number} offendingState
     * @return {void}
     * @protected
     * @final
     */
    setOffendingState(offendingState) {
        this.offendingState = offendingState;
    }

    /**
     * Gets the set of input symbols which could potentially follow the
     * previously matched symbol at the time this exception was thrown.
     *
     * <p>If the set of expected tokens is not known and could not be computed,
     * this method returns {@code null}.</p>
     *
     * @return {org.antlr.v4.runtime.IntervalSet} The set of token types that
     * could potentially follow the current state in the ATN, or {@code null}
     * if the information is not available.
     */
    getExpectedTokens() {
        if (this.recognizer !== null) {
            return this.recognizer.getATN().getExpectedTokens(this.offendingState, this.ctx);
        }
        return null;
    }

    /**
     * Gets the {@link RuleContext} at the time this exception was thrown.
     *
     * <p>If the context is not available, this method returns {@code null}.</p>
     *
     * @return {org.antlr.v4.runtime.RuleContext} The {@link RuleContext} at
     * the time this exception was thrown.
     * If the context is not available, this method returns {@code null}.
     */
    getCtx() {
        return this.ctx;
    }

    /**
     * Gets the input stream which is the symbol source for the recognizer where
     * this exception was thrown.
     *
     * <p>If the input stream is not available, this method returns {@code null}.</p>
     *
     * @return {org.antlr.v4.runtime.IntStream} The input stream which is the
     * symbol source for the recognizer where this exception was thrown, or
     * {@code null} if the stream is not available.
     */
    getInputStream() {
        return this.input;
    }

    /**
     * @return {org.antlr.v4.runtime.Token}
     */
    getOffendingToken() {
        return this.offendingToken;
    }

    /**
     * @param {org.antlr.v4.runtime.Token} offendingToken
     * @return {void}
     * @protected
     */
    setOffendingToken(offendingToken) {
        this.offendingToken = offendingToken;
    }

    /**
     * Gets the {@link Recognizer} where this exception occurred.
     *
     * <p>If the recognizer is not available, this method returns {@code null}.</p>
     *
     * @return {org.antlr.v4.runtime.Recognizer<?, ?>} The recognizer where
     * this exception occurred, or {@code null} if the recognizer is not available.
     */
    getRecognizer() {
        return this.recognizer;
    }
};


exports = RecognitionException;
