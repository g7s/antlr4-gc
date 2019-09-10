/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.BlockStartState');


const DecisionState = goog.require('org.antlr.v4.runtime.atn.DecisionState');

/**
 * The start of a regular {@code (...)} block.
 *
 * @abstract
 */
class BlockStartState extends DecisionState {
    constructor() {
        super();
        /**
         * @type {org.antlr.v4.runtime.atn.BlockEndState}
         */
        this.endState = null;
    }
}


exports = BlockStartState;
