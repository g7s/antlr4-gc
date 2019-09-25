/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.StarBlockStartState');
goog.module.declareLegacyNamespace();


const BlockStartState = goog.require('org.antlr.v4.runtime.atn.BlockStartState');
const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');

/**
 * The block that begins a closure loop.
 */
class StarBlockStartState extends BlockStartState {
    getStateType() {
        return ATNState.STAR_BLOCK_START;
    }
}


exports = StarBlockStartState;
