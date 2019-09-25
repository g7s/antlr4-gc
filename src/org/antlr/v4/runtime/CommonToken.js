/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.CommonToken');
goog.module.declareLegacyNamespace();


const Token = goog.require('org.antlr.v4.runtime.Token');
const WritableToken = goog.require('org.antlr.v4.runtime.WritableToken');
const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');
const Pair = goog.require('org.antlr.v4.runtime.misc.Pair');

/**
 * @implements {WritableToken}
 */
class CommonToken {
    /**
     * @param {!Token|!Pair<org.antlr.v4.runtime.TokenSource, org.antlr.v4.runtime.CharStream>|number} a
     * @param {number|string=} b
     * @param {number=} channel
     * @param {number=} start
     * @param {number=} stop
     */
    constructor(a, b, channel, start, stop) {
        /**
         * This is the backing field for {@link #getType} and {@link #setType}.
         *
         * @protected {number}
         */
        this.type = 0;
        /**
         * This is the backing field for {@link #getLine} and {@link #setLine}.
         *
         * @protected {number}
         */
        this.line = 0;
        /**
         * This is the backing field for {@link #getCharPositionInLine} and
         * {@link #setCharPositionInLine}.
         *
         * @protected {number}
         */
        this.charPositionInLine = -1; // set to invalid position
        /**
         * This is the backing field for {@link #getChannel} and
         * {@link #setChannel}.
         *
         * @protected {number}
         */
        this.channel = channel || Token.DEFAULT_CHANNEL;
        /**
         * This is the backing field for {@link #getTokenSource} and
         * {@link #getInputStream}.
         *
         * <p>
         * These properties share a field to reduce the memory footprint of
         * {@link CommonToken}. Tokens created by a {@link CommonTokenFactory} from
         * the same source and input stream share a reference to the same
         * {@link Pair} containing these values.</p>
         *
         * @protected {!Pair<org.antlr.v4.runtime.TokenSource, org.antlr.v4.runtime.CharStream>}
         */
        this.source = CommonToken.EMPTY_SOURCE;
        /**
         * This is the backing field for {@link #getText} when the token text is
         * explicitly set in the constructor or via {@link #setText}.
         *
         * @see #getText()
         *
         * @protected {?string}
         */
        this.text = null;
        /**
         * This is the backing field for {@link #getTokenIndex} and
         * {@link #setTokenIndex}.
         *
         * @protected {number}
         */
        this.index = -1;
        /**
         * This is the backing field for {@link #getStartIndex} and
         * {@link #setStartIndex}.
         *
         * @protected {number}
         */
        this.start = start || -1;
        /**
         * This is the backing field for {@link #getStopIndex} and
         * {@link #setStopIndex}.
         *
         * @protected {number}
         */
        this.stop = stop || -1;

        if (goog.isNumber(a)) {
            this.type = /** @type {number} */ (a);
            this.channel = Token.DEFAULT_CHANNEL;
            this.text = /** @type {string} */ (b);
        } else if (a instanceof Pair) {
            this.source = /** @type {!Pair<org.antlr.v4.runtime.TokenSource, org.antlr.v4.runtime.CharStream>} */ (a);
            this.type = /** @type {number} */ (b);
            if (this.source.a != null) {
                this.line = this.source.a.getLine();
                this.charPositionInLine = this.source.a.getCharPositionInLine();
            }
        } else if (a instanceof Token) {
            var oldToken = /** @type {!Token} */ (a);
            this.type = oldToken.getType();
            this.line = oldToken.getLine();
            this.index = oldToken.getTokenIndex();
            this.charPositionInLine = oldToken.getCharPositionInLine();
            this.channel = oldToken.getChannel();
            this.start = oldToken.getStartIndex();
            this.stop = oldToken.getStopIndex();

            if (oldToken instanceof CommonToken) {
                this.text = /** @type {!CommonToken} */ (oldToken).text;
                this.source = /** @type {!CommonToken} */ (oldToken).source;
            } else {
                this.text = oldToken.getText();
                this.source = new Pair(oldToken.getTokenSource(), oldToken.getInputStream());
            }
        }
    }

    getType() {
        return this.type;
    }

    setLine(line) {
        this.line = line;
    }

    getText() {
        if (this.text != null) {
            return this.text;
        }
        var input = this.getInputStream();
        if (input == null) return null;
        var n = input.size();
        if (this.start < n && this.stop < n) {
            return input.getText(Interval.of(this.start, this.stop));
        }
        else {
            return "<EOF>";
        }
    }

    setText(text) {
        this.text = text;
    }

    getLine() {
        return this.line;
    }

    getCharPositionInLine() {
        return this.charPositionInLine;
    }

    setCharPositionInLine(charPositionInLine) {
        this.charPositionInLine = charPositionInLine;
    }

    getChannel() {
        return this.channel;
    }

    setChannel(channel) {
        this.channel = channel;
    }

    setType(type) {
        this.type = type;
    }

    getStartIndex() {
        return this.start;
    }

    /**
     * @param {number} start
     */
    setStartIndex(start) {
        this.start = start;
    }

    /**
     * @return {number}
     */
    getStopIndex() {
        return this.stop;
    }

    /**
     * @param {number} stop
     * @return {void}
     */
    setStopIndex(stop) {
        this.stop = stop;
    }

    getTokenIndex() {
        return this.index;
    }

    setTokenIndex(index) {
        this.index = index;
    }

    getTokenSource() {
        return this.source.a;
    }

    getInputStream() {
        return this.source.b;
    }

    /**
     * @param {org.antlr.v4.runtime.Recognizer=} r
     * @return {string}
     */
    toString(r) {
        var channelStr = "";
        if (this.channel > 0) {
            channelStr = ",channel=" + this.channel;
        }
        var txt = this.getText();
        if (txt != null) {
            txt = txt.replace("\n","\\n");
            txt = txt.replace("\r","\\r");
            txt = txt.replace("\t","\\t");
        }
        else {
            txt = "<no text>";
        }
        var typeString = "" + this.type;
        if (r != null) {
            typeString = r.getVocabulary().getDisplayName(this.type);
        }
        return "[@"+this.getTokenIndex()+","+this.start+":"+this.stop+"='"+txt+"',<"+typeString+">"+channelStr+","+this.line+":"+this.getCharPositionInLine()+"]";
    }

};

/**
 * An empty {@link Pair} which is used as the default value of
 * {@link #source} for tokens that do not have a source.
 *
 * @type {!Pair<?, ?>}
 */
CommonToken.EMPTY_SOURCE = new Pair(null, null);


exports = CommonToken;
