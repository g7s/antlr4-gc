/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.PlusLoopbackState');
goog.module.declareLegacyNamespace();


const DecisionState = goog.require('org.antlr.v4.runtime.atn.DecisionState');
const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');

/**
 * Decision state for {@code A+} and {@code (A|B)+}.  It has two transitions:
 * one to the loop back to start of the block and one to exit.
 */
class PlusLoopbackState extends DecisionState {
    getStateType() {
        return ATNState.PLUS_LOOP_BACK;
    }
}


exports = PlusLoopbackState;
