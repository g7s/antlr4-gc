/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.tree.TerminalNode');
goog.module.declareLegacyNamespace();


const ParseTree = goog.require('org.antlr.v4.runtime.tree.ParseTree');

/**
 * @interface
 */
class TerminalNode extends ParseTree {
    /**
     * @return {org.antlr.v4.runtime.Token}
     */
    getSymbol() {}
}


exports = TerminalNode;
