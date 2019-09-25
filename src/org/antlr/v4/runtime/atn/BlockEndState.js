/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.BlockEndState');
goog.module.declareLegacyNamespace();


const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');

/**
 * Terminal node of a simple {@code (a|b|c)} block.
 */
class BlockEndState extends ATNState {
    constructor() {
        super();
        /**
         * @type {org.antlr.v4.runtime.atn.BlockStartState}
         */
        this.startState = null;
    }

    getStateType() {
        return ATNState.BLOCK_END;
    }
}


exports = BlockEndState;
