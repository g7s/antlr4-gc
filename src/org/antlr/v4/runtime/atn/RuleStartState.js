/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.RuleStartState');
goog.module.declareLegacyNamespace();


const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');

class RuleStartState extends ATNState {
    constructor() {
        super();
        /**
         * @type {org.antlr.v4.runtime.atn.RuleStopState}
         */
        this.stopState = null;
        /**
         * @type {boolean}
         */
        this.isLeftRecursiveRule = false;
    }

    getStateType() {
        return ATNState.RULE_START;
    }
}


exports = RuleStartState;
