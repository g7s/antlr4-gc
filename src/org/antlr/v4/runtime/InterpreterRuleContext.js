/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.InterpreterRuleContext');
goog.module.declareLegacyNamespace();


const ParserRuleContext = goog.require('org.antlr.v4.runtime.ParserRuleContext');

/**
 * This class extends {@link ParserRuleContext} by allowing the value of
 * {@link #getRuleIndex} to be explicitly set for the context.
 *
 * <p>
 * {@link ParserRuleContext} does not include field storage for the rule index
 * since the context classes created by the code generator override the
 * {@link #getRuleIndex} method to return the correct value for that context.
 * Since the parser interpreter does not use the context classes generated for a
 * parser, this class (with slightly more memory overhead per node) is used to
 * provide equivalent functionality.</p>
 */
class InterpreterRuleContext extends ParserRuleContext {
    /**
     * Constructs a new {@link InterpreterRuleContext} with the specified
     * parent, invoking state, and rule index.
     *
     * @param {ParserRuleContext=} parent The parent context.
     * @param {number=} invokingStateNumber The invoking state number.
     * @param {number=} ruleIndex The rule index for the current context.
     */
    constructor(parent, invokingStateNumber, ruleIndex) {
        super(parent, invokingStateNumber);
        /**
         * This is the backing field for {@link #getRuleIndex}.
         *
         * @protected {number}
         */
        this.ruleIndex = ruleIndex || 0;
    }

    getRuleIndex() {
        return this.ruleIndex;
    }
};


exports = InterpreterRuleContext;
