/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.RuleContextWithAltNum');
goog.module.declareLegacyNamespace();


const ParserRuleContext = goog.require('org.antlr.v4.runtime.ParserRuleContext');

/** A handy class for use with
 *
 *  options {contextSuperClass=org.antlr.v4.runtime.RuleContextWithAltNum;}
 *
 *  that provides a backing field / impl for the outer alternative number
 *  matched for an internal parse tree node.
 *
 *  I'm only putting into Java runtime as I'm certain I'm the only one that
 *  will really every use this.
 */
class RuleContextWithAltNum extends ParserRuleContext {
    /**
     * @param {org.antlr.v4.runtime.RuleContext=} parent
     * @param {number=} invokingStateNumber
     */
    constructor(parent, invokingStateNumber) {
        super(parent, invokingStateNumber);
        this.altNum = ParserRuleContext.ATNINVALID_ALT_NUMBER;
    }

    getAltNumber() {
        return this.altNum;
    }

    setAltNumber(altNum) {
        this.altNum = altNum;
    }
};


exports = RuleContextWithAltNum;
