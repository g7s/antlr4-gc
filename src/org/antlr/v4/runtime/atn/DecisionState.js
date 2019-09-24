/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.DecisionState');
goog.module.declareLegacyNamespace();


const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');

/**
 * @abstract
 */
class DecisionState extends ATNState {
	constructor() {
        super();
        /**
         * @type {number}
         */
        this.decision = -1;
        /**
         * @type {boolean}
         */
        this.nonGreedy = false;
    }
}


exports = DecisionState;
