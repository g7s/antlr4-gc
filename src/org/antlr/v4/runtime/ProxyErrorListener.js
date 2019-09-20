/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.ProxyErrorListener');


const ANTLRErrorListener = goog.require('org.antlr.v4.runtime.ANTLRErrorListener');

/**
 * This implementation of {@link ANTLRErrorListener} dispatches all calls to a
 * collection of delegate listeners. This reduces the effort required to support multiple
 * listeners.
 *
 * @author Sam Harwell
 * @implements {ANTLRErrorListener}
 */
class ProxyErrorListener {
    /**
     * @param {Array<org.antlr.v4.runtime.ANTLRErrorListener>} d
     */
    constructor(d) {
        /**
         * @private
         * @type {Array<org.antlr.v4.runtime.ANTLRErrorListener>}
         */
        this.delegates = d;
    }

    syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
        this.delegates.forEach(listener => {
            listener.syntaxError(recognizer, offendingSymbol, line, column, msg, e);
        });
    }

    reportAmbiguity(recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs) {
        this.delegates.forEach(listener => {
            listener.reportAmbiguity(recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs);
        });
    }

    reportAttemptingFullContext(recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs) {
        this.delegates.forEach(listener => {
            listener.reportAttemptingFullContext(recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs);
        });
    }

    reportContextSensitivity(recognizer, dfa, startIndex, stopIndex, prediction, configs) {
        this.delegates.forEach(listener => {
            listener.reportContextSensitivity(recognizer, dfa, startIndex, stopIndex, prediction, configs);
        });
    }
};

exports = ProxyErrorListener;
