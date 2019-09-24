/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.BaseErrorListener');
goog.module.declareLegacyNamespace();


const ANTLRErrorListener = goog.require('org.antlr.v4.runtime.ANTLRErrorListener');

/**
 * Provides an empty default implementation of {@link ANTLRErrorListener}. The
 * default implementation of each method does nothing, but can be overridden as
 * necessary.
 *
 * @author Sam Harwell
 * @implements {ANTLRErrorListener}
 */
class BaseErrorListener {
    syntaxError(recognizer, offendingSymbol, line, column, msg, e) {}
    reportAmbiguity(recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs) {}
    reportAttemptingFullContext(recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs) {}
    reportContextSensitivity(recognizer, dfa, startIndex, stopIndex, prediction, configs) {}
};

exports = BaseErrorListener;
