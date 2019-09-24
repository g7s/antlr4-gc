/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.PlusBlockStartState');
goog.module.declareLegacyNamespace();


const BlockStartState = goog.require('org.antlr.v4.runtime.atn.BlockStartState');
const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');

/**
 * Start of {@code (A|B|...)+} loop. Technically a decision state, but
 * we don't use for code generation; somebody might need it, so I'm defining
 * it for completeness. In reality, the {@link PlusLoopbackState} node is the
 * real decision-making note for {@code A+}.
 */
class PlusBlockStartState extends BlockStartState {
    constructor() {
        super();
        /**
         * @type {org.antlr.v4.runtime.atn.PlusLoopbackState}
         */
        this.loopBackState = null;
    }

	getStateType() {
		return ATNState.PLUS_BLOCK_START;
	}
}


exports = PlusBlockStartState;
