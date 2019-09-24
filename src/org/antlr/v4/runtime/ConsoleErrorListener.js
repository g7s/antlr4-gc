/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.ConsoleErrorListener');
goog.module.declareLegacyNamespace();


const BaseErrorListener = goog.require('org.antlr.v4.runtime.BaseErrorListener');

/**
 *
 * @author Sam Harwell
 */
class ConsoleErrorListener extends BaseErrorListener {
    /**
     * <p>
     * This implementation prints messages to {@link System#err} containing the
     * values of {@code line}, {@code charPositionInLine}, and {@code msg} using
     * the following format.</p>
     *
     * <pre>
     * line <em>line</em>:<em>charPositionInLine</em> <em>msg</em>
     * </pre>
     */
    syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
        console.error("line " + line + ":" + column + " " + msg);
    }
};

goog.addSingletonGetter(ConsoleErrorListener);

exports = ConsoleErrorListener;
