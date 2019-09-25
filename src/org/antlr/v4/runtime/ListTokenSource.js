/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.ListTokenSource');
goog.module.declareLegacyNamespace();


const Token = goog.require('org.antlr.v4.runtime.Token');
const TokenSource = goog.require('org.antlr.v4.runtime.TokenSource');
const CommonTokenFactory = goog.require('org.antlr.v4.runtime.CommonTokenFactory');
const Pair = goog.require('org.antlr.v4.runtime.misc.Pair');

/**
 * Provides an implementation of {@link TokenSource} as a wrapper around a list
 * of {@link Token} objects.
 *
 * <p>If the final token in the list is an {@link Token#EOF} token, it will be used
 * as the EOF token for every call to {@link #nextToken} after the end of the
 * list is reached. Otherwise, an EOF token will be created.</p>
 *
 * @implements {TokenSource}
 */
class ListTokenSource {
    /**
     * Constructs a new {@link ListTokenSource} instance from the specified
     * collection of {@link Token} objects and source name.
     *
     * @param {Array<org.antlr.v4.runtime.Token>} tokens The collection of {@link Token} objects to provide as a
     * {@link TokenSource}.
     * @param {?string} sourceName The name of the {@link TokenSource}. If this value is
     * {@code null}, {@link #getSourceName} will attempt to infer the name from
     * the next {@link Token} (or the previous token if the end of the input has
     * been reached).
     *
     * @throws {Error} NullPointerException if {@code tokens} is {@code null}
     */
    constructor(tokens, sourceName) {
        if (tokens == null) {
            throw new Error("tokens cannot be null");
        }
        /**
         * The wrapped collection of {@link Token} objects to return.
         *
         * @protected {Array<org.antlr.v4.runtime.Token>}
         */
        this.tokens = tokens;
        /**
         * The name of the input source. If this value is {@code null}, a call to
         * {@link #getSourceName} should return the source name used to create the
         * the next token in {@link #tokens} (or the previous token if the end of
         * the input has been reached).
         *
         * @private {?string}
         */
        this.sourceName = sourceName;
        /**
         * The index into {@link #tokens} of token to return by the next call to
         * {@link #nextToken}. The end of the input is indicated by this value
         * being greater than or equal to the number of items in {@link #tokens}.
         *
         * @protected {number}
         */
        this.i = 0;
        /**
         * This field caches the EOF token for the token source.
         *
         * @protected {org.antlr.v4.runtime.Token}
         */
        this.eofToken = null;
        /**
         * This is the backing field for {@link #getTokenFactory} and
         * {@link setTokenFactory}.
         *
         * @private {org.antlr.v4.runtime.TokenFactory<?>}
         */
        this._factory = CommonTokenFactory.DEFAULT;
    }

    getCharPositionInLine() {
        if (this.i < this.tokens.length) {
            return this.tokens[this.i].getCharPositionInLine();
        }
        else if (this.eofToken != null) {
            return this.eofToken.getCharPositionInLine();
        }
        else if (this.tokens.length > 0) {
            // have to calculate the result from the line/column of the previous
            // token, along with the text of the token.
            var lastToken = this.tokens[this.tokens.length - 1];
            var tokenText = lastToken.getText();
            if (tokenText != null) {
                var lastNewLine = tokenText.lastIndexOf('\n');
                if (lastNewLine >= 0) {
                    return tokenText.length - lastNewLine - 1;
                }
            }

            return lastToken.getCharPositionInLine() + lastToken.getStopIndex() - lastToken.getStartIndex() + 1;
        }

        // only reach this if tokens is empty, meaning EOF occurs at the first
        // position in the input
        return 0;
    }

    nextToken() {
        if (this.i >= this.tokens.size()) {
            if (this.eofToken == null) {
                var start = -1;
                if (this.tokens.length > 0) {
                    var previousStop = this.tokens[this.tokens.length - 1].getStopIndex();
                    if (previousStop != -1) {
                        start = previousStop + 1;
                    }
                }

                var stop = Math.max(-1, start - 1);
                var pair = /** @type {!Pair<org.antlr.v4.runtime.TokenSource, org.antlr.v4.runtime.CharStream>} */ (new Pair(this, this.getInputStream()));
                this.eofToken = this._factory.create(pair, Token.EOF, "EOF", Token.DEFAULT_CHANNEL, start, stop, this.getLine(), this.getCharPositionInLine());
            }

            return this.eofToken;
        }

        var t = this.tokens[this.i];
        if (this.i === (this.tokens.length - 1) && t.getType() === Token.EOF) {
            this.eofToken = t;
        }

        this.i++;
        return t;
    }

    getLine() {
        if (this.i < this.tokens.length) {
            return this.tokens[this.i].getLine();
        }
        else if (this.eofToken != null) {
            return this.eofToken.getLine();
        }
        else if (this.tokens.length > 0) {
            // have to calculate the result from the line/column of the previous
            // token, along with the text of the token.
            var lastToken = this.tokens[this.tokens.length - 1];
            var line = lastToken.getLine();

            var tokenText = lastToken.getText();
            if (tokenText != null) {
                for (var i = 0; i < tokenText.length; i++) {
                    if (tokenText[i] == '\n') {
                        line++;
                    }
                }
            }

            // if no text is available, assume the token did not contain any newline characters.
            return line;
        }

        // only reach this if tokens is empty, meaning EOF occurs at the first
        // position in the input
        return 1;
    }

    getInputStream() {
        if (this.i < this.tokens.length) {
            return this.tokens[this.i].getInputStream();
        }
        else if (this.eofToken != null) {
            return this.eofToken.getInputStream();
        }
        else if (this.tokens.length > 0) {
            return this.tokens[this.tokens.length - 1].getInputStream();
        }

        // no input stream information is available
        return null;
    }

    getSourceName() {
        if (this.sourceName != null) {
            return this.sourceName;
        }

        var inputStream = this.getInputStream();
        if (inputStream != null) {
            return inputStream.getSourceName();
        }

        return "List";
    }

    setTokenFactory(factory) {
        this._factory = factory;
    }

    getTokenFactory() {
        return this._factory;
    }
};


exports = ListTokenSource;
