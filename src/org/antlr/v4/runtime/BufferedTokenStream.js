/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.BufferedTokenStream');


const Token = goog.require('org.antlr.v4.runtime.Token');
const WritableToken = goog.require('org.antlr.v4.runtime.WritableToken');
const Lexer = goog.require('org.antlr.v4.runtime.Lexer');
const RuleContext = goog.require('org.antlr.v4.runtime.RuleContext');
const TokenStream = goog.require('org.antlr.v4.runtime.TokenStream');
const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');
const {contains} = goog.require('goog.array');
const {assert} = goog.require('goog.asserts');

/**
 * This implementation of {@link TokenStream} loads tokens from a
 * {@link TokenSource} on-demand, and places the tokens in a buffer to provide
 * access to any previous token by index.
 *
 * <p>
 * This token stream ignores the value of {@link Token#getChannel}. If your
 * parser requires the token stream filter tokens to only those on a particular
 * channel, such as {@link Token#DEFAULT_CHANNEL} or
 * {@link Token#HIDDEN_CHANNEL}, use a filtering token stream such a
 * {@link CommonTokenStream}.</p>
 *
 * @implements {TokenStream}
 */
class BufferedTokenStream {
    /**
     * @param {!org.antlr.v4.runtime.TokenSource} tokenSource
     */
    constructor(tokenSource) {
        /**
         * A collection of all tokens fetched from the token source. The list is
         * considered a complete view of the input once {@link #fetchedEOF} is set
         * to {@code true}.
         *
         * @protected {!Array<org.antlr.v4.runtime.Token>}
         */
        this.tokens = [];
        /**
         * The index into {@link #tokens} of the current token (next token to
         * {@link #consume}). {@link #tokens}{@code [}{@link #p}{@code ]} should be
         * {@link #LT LT(1)}.
         *
         * <p>This field is set to -1 when the stream is first constructed or when
         * {@link #setTokenSource} is called, indicating that the first token has
         * not yet been fetched from the token source. For additional information,
         * see the documentation of {@link IntStream} for a description of
         * Initializing Methods.</p>
         *
         * @protected {number}
         */
        this.p = -1;
        /**
         * Indicates whether the {@link Token#EOF} token has been fetched from
         * {@link #tokenSource} and added to {@link #tokens}. This field improves
         * performance for the following cases:
         *
         * <ul>
         * <li>{@link #consume}: The lookahead check in {@link #consume} to prevent
         * consuming the EOF symbol is optimized by checking the values of
         * {@link #fetchedEOF} and {@link #p} instead of calling {@link #LA}.</li>
         * <li>{@link #fetch}: The check to prevent adding multiple EOF symbols into
         * {@link #tokens} is trivial with this field.</li>
         * <ul>
         *
         * @protected {boolean}
         */
        this.fetchedEOF = false;
        /**
         * The {@link TokenSource} from which tokens for this stream are fetched.
         *
         * @protected {!org.antlr.v4.runtime.TokenSource}
         */
        this.tokenSource = tokenSource;
    }

    getTokenSource() {
        return this.tokenSource;
    }

    index() {
        return this.p;
    }

    mark() {
        return 0;
    }

    release(marker) {
        // no resources to release
    }

    /**
     * This method resets the token stream back to the first token in the
     * buffer. It is equivalent to calling {@link #seek}{@code (0)}.
     *
     * @see #setTokenSource(TokenSource)
     * @deprecated Use {@code seek(0)} instead.
     */
    reset() {
        this.seek(0);
    }

    seek(index) {
        this.lazyInit();
        this.p = this.adjustSeekIndex(index);
    }

    size() {
        return this.tokens.length;
    }

    consume() {
        var skipEofCheck = false;
        if (this.p >= 0) {
            if (this.fetchedEOF) {
                // the last token in tokens is EOF. skip check if p indexes any
                // fetched token except the last.
                skipEofCheck = this.p < this.size() - 1;
            }
            else {
                // no EOF token in tokens. skip check if p indexes a fetched token.
                skipEofCheck = this.p < this.size();
            }
        }

        if (!skipEofCheck && this.LA(1) === Token.EOF) {
            throw new Error("cannot consume EOF");
        }

        if (this.sync(this.p + 1)) {
            this.p = this.adjustSeekIndex(this.p + 1);
        }
    }

    /**
     * Make sure index {@code i} in tokens has a token.
     *
     * @protected
     * @param {number} i
     * @return {boolean} {@code true} if a token is located at index {@code i}, otherwise
     *    {@code false}.
     * @see #get(int i)
     */
    sync(i) {
        assert(i >= 0);
        var n = i - this.size() + 1; // how many more elements we need?
        //System.out.println("sync("+i+") needs "+n);
        if (n > 0) {
            return this.fetch(n) >= n;
        }
        return true;
    }

    /** Add {@code n} elements to buffer.
     *
     * @protected
     * @param {number} n
     * @return {number} The actual number of elements added to the buffer.
     */
    fetch(n) {
        if (this.fetchedEOF) {
            return 0;
        }
        for (var i = 0; i < n; i++) {
            var t = this.tokenSource.nextToken();
            if (t instanceof WritableToken) {
                t.setTokenIndex(this.size());
            }
            this.tokens.push(t);
            if (t.getType() === Token.EOF) {
                this.fetchedEOF = true;
                return i + 1;
            }
        }
        return n;
    }

    get(i) {
        if (i < 0 || i >= this.size()) {
            throw new Error("token index "+i+" out of range 0.."+(this.size()-1));
        }
        return /** @type {!Token} */ (this.tokens[i]);
    }

    /**
     * Get all tokens from start..stop inclusively
     *
     * @param {number} start
     * @param {number} stop
     * @return {Array<Token>}
     */
    getRange(start, stop) {
        if (start < 0 || stop < 0) return null;
        this.lazyInit();
        /**
         * @type {Array<Token>}
         */
        var subset = [];
        if (stop >= this.size()) stop = this.size() - 1;
        for (var i = start; i <= stop; i++) {
            var t = this.tokens[i];
            if (t.getType() === Token.EOF) break;
            subset.push(t);
        }
        return subset;
    }

    LA(i) {
        return this.LT(i).getType();
    }

    /**
     * @protected
     * @param {number} k
     * @return {Token}
     */
    LB(k) {
        if ((this.p - k) < 0) return null;
        return this.tokens[this.p - k];
    }

    LT(k) {
        this.lazyInit();
        if (k === 0) return null;
        if (k < 0) return this.LB(-k);

		var i = this.p + k - 1;
		this.sync(i);
        if (i >= this.size()) { // return EOF token
            // EOF must be last token
            return this.tokens[this.size() - 1];
        }
        return this.tokens[i];
    }

    /**
     * Allowed derived classes to modify the behavior of operations which change
     * the current stream position by adjusting the target token index of a seek
     * operation. The default implementation simply returns {@code i}. If an
     * exception is thrown in this method, the current stream index should not be
     * changed.
     *
     * <p>For example, {@link CommonTokenStream} overrides this method to ensure that
     * the seek target is always an on-channel token.</p>
     *
     * @protected
     * @param {number} i The target token index.
     * @return {number} The adjusted target token index.
     */
    adjustSeekIndex(i) {
        return i;
    }

    /**
     * @protected
     * @return {void}
     */
    lazyInit() {
        if (this.p === -1) {
            this.setup();
        }
    }

    /**
     * @protected
     * @return {void}
     */
    setup() {
        this.sync(0);
        this.p = this.adjustSeekIndex(0);
    }

    /**
     * Reset this token stream by setting its token source.
     *
     * @param {!org.antlr.v4.runtime.TokenSource} tokenSource
     * @return {void}
     */
    setTokenSource(tokenSource) {
        this.tokenSource = tokenSource;
        this.tokens = [];
        this.p = -1;
        this.fetchedEOF = false;
    }

    /**
     * @param {number=} start
     * @param {number=} stop
     * @param {Array<number>=} types
     * @return {?Array<Token>}
     */
    getTokens(start, stop, types) {
        if (arguments.length === 0) {
            return this.tokens;
        }
        start = start || 0;
        stop = stop || 0;
        this.lazyInit();
        if (start < 0 || stop >= this.size() || stop < 0 || start >= this.size()) {
            throw new Error("start "+start+" or stop "+stop+
                                                " not in 0.."+(this.size()-1));
        }
        if (start > stop) return null;

        // list = tokens[start:stop]:{T t, t.getType() in types}
        /**
         * @type {Array<Token>}
         */
        var filteredTokens = [];
        for (var i = start; i <= stop; i++) {
            var t = this.tokens[i];
            if (types == null || contains(types, t.getType())) {
                filteredTokens.push(t);
            }
        }
        if (filteredTokens.length === 0) {
            filteredTokens = null;
        }
        return filteredTokens;
    }

    /**
     * Given a starting index, return the index of the next token on channel.
     * Return {@code i} if {@code tokens[i]} is on channel. Return the index of
     * the EOF token if there are no tokens on channel between {@code i} and
     * EOF.
     *
     * @protected
     * @param {number} i
     * @param {number} channel
     * @return {number}
     */
    nextTokenOnChannel(i, channel) {
        this.sync(i);
        if (i >= this.size()) {
            return this.size() - 1;
        }
        var token = this.tokens[i];
        while (token.getChannel() !== channel) {
            if (token.getType() === Token.EOF ) {
                return i;
            }
            i++;
            this.sync(i);
            token = this.tokens[i];
        }
        return i;
    }

    /**
     * Given a starting index, return the index of the previous token on
     * channel. Return {@code i} if {@code tokens[i]} is on channel. Return -1
     * if there are no tokens on channel between {@code i} and 0.
     *
     * <p>
     * If {@code i} specifies an index at or after the EOF token, the EOF token
     * index is returned. This is due to the fact that the EOF token is treated
     * as though it were on every channel.</p>
     *
     * @protected
     * @param {number} i
     * @param {number} channel
     * @return {number}
     */
    previousTokenOnChannel(i, channel) {
        this.sync(i);
        if (i >= this.size()) {
            // the EOF token is on every channel
            return this.size() - 1;
        }

        while (i >= 0) {
            var token = this.tokens[i];
            if (token.getType() === Token.EOF || token.getChannel() === channel) {
                return i;
            }
            i--;
        }

        return i;
    }

    /**
     * Collect all tokens on specified channel to the right of
     * the current token up until we see a token on DEFAULT_TOKEN_CHANNEL or
     * EOF. If channel is -1, find any non default channel token.
     *
     * @param {number} tokenIndex
     * @param {number=} channel
     * @return {Array<Token>}
     */
    getHiddenTokensToRight(tokenIndex, channel) {
        this.lazyInit();
        if (tokenIndex < 0 || tokenIndex >= this.size()) {
            throw new Error(tokenIndex+" not in 0.."+(this.size()-1));
        }
        var nextOnChannel = this.nextTokenOnChannel(tokenIndex + 1, Lexer.DEFAULT_TOKEN_CHANNEL);
        /** @type {number} */
        var to;
        var from = tokenIndex + 1;
        // if none onchannel to right, nextOnChannel=-1 so set to = last token
        if (nextOnChannel == -1) to = this.size() - 1;
        else to = nextOnChannel;
        return this.filterForChannel(from, to, channel || -1);
    }

    /**
     * Collect all tokens on specified channel to the left of
     * the current token up until we see a token on DEFAULT_TOKEN_CHANNEL.
     * If channel is -1, find any non default channel token.
     *
     * @param {number} tokenIndex
     * @param {number=} channel
     * @return {Array<Token>}
     */
    getHiddenTokensToLeft(tokenIndex, channel) {
        this.lazyInit();
        if (tokenIndex < 0 || tokenIndex >= this.size()) {
            throw new Error(tokenIndex+" not in 0.."+(this.size()-1));
        }
        if (tokenIndex === 0) {
            // obviously no tokens can appear before the first token
            return null;
        }
        var prevOnChannel = this.previousTokenOnChannel(tokenIndex - 1, Lexer.DEFAULT_TOKEN_CHANNEL);
        if (prevOnChannel === tokenIndex - 1) return null;
        // if none onchannel to left, prevOnChannel=-1 then from=0
        var from = prevOnChannel + 1;
        var to = tokenIndex - 1;
        return this.filterForChannel(from, to, channel || -1);
    }

    /**
     * @protected
     * @param {number} from
     * @param {number} to
     * @param {number} channel
     * @return {?Array<Token>}
     */
    filterForChannel(from, to, channel) {
        /**
         * @type {Array<Token>}
         */
        var hidden = [];
        for (var i = from; i <= to; i++) {
            var t = this.tokens[i];
            if (channel === -1) {
                if (t.getChannel() !== Lexer.DEFAULT_TOKEN_CHANNEL) hidden.push(t);
            }
            else {
                if (t.getChannel() === channel) hidden.push(t);
            }
        }
        if (hidden.length === 0) return null;
        return hidden;
    }

    getSourceName() {
        return this.tokenSource.getSourceName();
    }

    /**
     * @private
     * @param {Interval} a
     * @return {string}
     */
    getTextInterval(a) {
        var start = a.a;
        var stop = a.b;
        if (start < 0 || stop < 0 ) return "";
        this.fill();
        if (stop >= this.size()) stop = this.size()-1;

        var s = "";
        for (var i = start; i <= stop; i++) {
            var t = this.tokens[i];
            if (t.getType() === Token.EOF) break;
            s += t.getText();
        }
        return s;
    }

    getText(a, b) {
        if (a instanceof Interval) {
            return this.getTextInterval(a);
        } else if (a instanceof Token) {
            if (!(b instanceof Token)) throw new Error("Invalid arguments");
            return this.getTextInterval(Interval.of(a.getTokenIndex(), b.getTokenIndex()));
        } else if (a instanceof RuleContext) {
            return this.getTextInterval(a.getSourceInterval());
        } else {
            return "";
        }
    }

    /**
     * Get all tokens from lexer until EOF
     *
     * @return {void}
     */
    fill() {
        this.lazyInit();
        var blockSize = 1000;
        while (true) {
            var fetched = this.fetch(blockSize);
            if (fetched < blockSize) {
                return;
            }
        }
    }
};


exports = BufferedTokenStream;
