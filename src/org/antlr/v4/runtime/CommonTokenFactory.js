/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.CommonTokenFactory');
goog.module.declareLegacyNamespace();


const CommonToken = goog.require('org.antlr.v4.runtime.CommonToken');
const TokenFactory = goog.require('org.antlr.v4.runtime.TokenFactory');
const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');
const Pair = goog.require('org.antlr.v4.runtime.misc.Pair');

/**
 * This default implementation of {@link TokenFactory} creates
 * {@link CommonToken} objects.
 *
 * @implements {TokenFactory<CommonToken>}
 */
class CommonTokenFactory {
    /**
     * Constructs a {@link CommonTokenFactory} with the specified value for
     * {@link #copyText}.
     *
     * <p>
     * When {@code copyText} is {@code false}, the {@link #DEFAULT} instance
     * should be used instead of constructing a new instance.</p>
     *
     * @param {boolean=} copyText The value for {@link #copyText}.
     */
    constructor(copyText) {
        /**
         * Indicates whether {@link CommonToken#setText} should be called after
         * constructing tokens to explicitly set the text. This is useful for cases
         * where the input stream might not be able to provide arbitrary substrings
         * of text from the input after the lexer creates a token (e.g. the
         * implementation of {@link CharStream#getText} in
         * {@link UnbufferedCharStream} throws an
         * {@link UnsupportedOperationException}). Explicitly setting the token text
         * allows {@link Token#getText} to be called at any time regardless of the
         * input stream implementation.
         *
         * <p>
         * The default value is {@code false} to avoid the performance and memory
         * overhead of copying text for every token unless explicitly requested.</p>
         *
         * @protected {boolean}
         */
        this.copyText = copyText || false;
    }

    create(source, type, text, channel, start, stop, line, charPositionInLine) {
        var t = new CommonToken(source, type, channel, start, stop);
        t.setLine(line);
        t.setCharPositionInLine(charPositionInLine);
        if (text != null) {
            t.setText(text);
        }
        else if (this.copyText && source.b != null) {
            t.setText(source.b.getText(Interval.of(start, stop)));
        }
        return t;
    }
};

/**
 * The default {@link CommonTokenFactory} instance.
 *
 * <p>
 * This token factory does not explicitly copy token text when constructing
 * tokens.</p>
 *
 * @type {TokenFactory<org.antlr.v4.runtime.CommonToken>}
 */
CommonTokenFactory.DEFAULT = new CommonTokenFactory();


exports = CommonTokenFactory;
