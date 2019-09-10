/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.ANTLRInputStream');


const IntStream = goog.require('org.antlr.v4.runtime.IntStream');
const CharStream = goog.require('org.antlr.v4.runtime.CharStream');
const {assert} = goog.require('goog.asserts');

class ANTLRInputStream extends CharStream {
    /**
     *
     * @param {string} input
     */
    constructor(input) {
        /**
         * 0..n-1 index into string of next char
         * @private {number}
         */
        this.p = 0;
        /**
         * The data being scanned
         * @private {Array.<number>}
         */
        this.data = [];
        /**
         * @private {string}
         */
        this.source = input;
        for (var i = 0; i < this.source.length; i++) {
            var codeUnit = this.source.charCodeAt(i);
            this.data.push(codeUnit);
        }
        /**
         * How many characters are actually in the buffer
         * @private {number}
         */
        this.n = this.data.length;
        /**
         * What is name or source of this char stream?
         * @private {string}
         */
        this.name = "<utf-16>";
    }

    /**
     * Reset the stream so that it's in the same state it was
     * when the object was created *except* the data array is not
     * touched.
     * @return {void}
     */
    reset() {
        this.p = 0;
    }

    consume() {
        if (this.p >= this.n) {
            assert(this.LA(1) === IntStream.EOF);
            throw new Error("cannot consume EOF");
        }
        this.p++;
    }

    LA(i) {
        if (i === 0) {
            return 0; // undefined
        }
        if (i < 0) {
            i++; // e.g., translate LA(-1) to use offset i=0; then data[p+0-1]
            if ((this.p + i - 1) < 0) {
                return IntStream.EOF; // invalid; no char before first char
            }
        }
        if ((this.p + i - 1) >= this.n ) {
            return IntStream.EOF;
        }
        return this.data[this.p + i - 1];
    }

    LT(i) {
        return this.LA(i);
    }

    /**
     * Return the current input symbol index 0..n where n indicates the
     * last symbol has been read.  The index is the index of char to
     * be returned from LA(1).
     */
    index() {
        return this.p;
    }

    size() {
        return this.n;
    }

    mark() {
        return -1;
    }

    release(marker) {}

    /**
     * consume() ahead until p==index; can't just set p=index as we must
     * update line and charPositionInLine. If we seek backwards, just set p
     */
    seek(index) {
        if (index <= this.p) {
            this.p = index; // just jump; don't update stream state (line, ...)
            return;
        }
        // seek forward, consume until p hits index or n (whichever comes first)
        index = Math.min(index, this.n);
        while (this.p < index) {
            this.consume();
        }
    }

    getText(interval) {
        let start = interval.a;
        let stop = interval.b;
        if (stop >= this.n) {
            stop = this.n - 1;
        }
        if (start >= this.n) {
            return "";
        } else {
            return this.source.slice(start, stop + 1);
        }
    }

    getSourceName() {
        if (this.name === null || this.name.isEmpty()) {
            return IntStream.UNKNOWN_SOURCE_NAME;
        }
        return this.name;
    }

    toString() {
        return this.source;
    }
};


exports = ANTLRInputStream;
