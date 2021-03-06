/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.BasicState');
goog.module.declareLegacyNamespace();


const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');

/**
 *
 * @author Sam Harwell
 */
class BasicState extends ATNState {
    getStateType() {
        return ATNState.BASIC;
    }
}


exports = BasicState;
