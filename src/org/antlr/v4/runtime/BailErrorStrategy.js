/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.BailErrorStrategy');


const DefaultErrorStrategy = goog.require('org.antlr.v4.runtime.DefaultErrorStrategy');
const ParseCancellationException = goog.require('org.antlr.v4.runtime.misc.ParseCancellationException');
const InputMismatchException = goog.require('org.antlr.v4.runtime.InputMismatchException');

/**
 * This implementation of {@link ANTLRErrorStrategy} responds to syntax errors
 * by immediately canceling the parse operation with a
 * {@link ParseCancellationException}. The implementation ensures that the
 * {@link ParserRuleContext#exception} field is set for all parse tree nodes
 * that were not completed prior to encountering the error.
 *
 * <p>
 * This error strategy is useful in the following scenarios.</p>
 *
 * <ul>
 * <li><strong>Two-stage parsing:</strong> This error strategy allows the first
 * stage of two-stage parsing to immediately terminate if an error is
 * encountered, and immediately fall back to the second stage. In addition to
 * avoiding wasted work by attempting to recover from errors here, the empty
 * implementation of {@link BailErrorStrategy#sync} improves the performance of
 * the first stage.</li>
 * <li><strong>Silent validation:</strong> When syntax errors are not being
 * reported or logged, and the parse result is simply ignored if errors occur,
 * the {@link BailErrorStrategy} avoids wasting work on recovering from errors
 * when the result will be ignored either way.</li>
 * </ul>
 *
 * <p>
 * {@code myparser.setErrorHandler(new BailErrorStrategy());}</p>
 *
 * @see Parser#setErrorHandler(ANTLRErrorStrategy)
 */
class BailErrorStrategy extends DefaultErrorStrategy {
    recover(recognizer, e) {
        for (var context = /** @type {org.antlr.v4.runtime.ParserRuleContext} */ (recognizer.getContext()); context !== null; context = /** @type {org.antlr.v4.runtime.ParserRuleContext} */ (context.getParent())) {
            context.exception = e;
        }
        throw new ParseCancellationException(e);
    }

    recoverInline(recognizer) {
        this.recover(recognizer, new InputMismatchException(recognizer));
        return null;
    }

    sync(recognizer) {}
};

exports = BailErrorStrategy;
