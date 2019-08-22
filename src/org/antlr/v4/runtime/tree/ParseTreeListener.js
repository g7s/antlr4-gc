/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.tree.ParseTreeListener');


/** This interface describes the minimal core of methods triggered
 *  by {@link ParseTreeWalker}. E.g.,
 *
 *  	ParseTreeWalker walker = new ParseTreeWalker();
 *		walker.walk(myParseTreeListener, myParseTree); <-- triggers events in your listener
 *
 *  If you want to trigger events in multiple listeners during a single
 *  tree walk, you can use the ParseTreeDispatcher object available at
 *
 * 		https://github.com/antlr/antlr4/issues/841
 *
 * @interface
 */
class ParseTreeListener {
    /**
     * @param {org.antlr.v4.runtime.tree.TerminalNode} node
     * @return {void}
     */
    visitTerminal(node) {}

    /**
     * @param {org.antlr.v4.runtime.tree.ErrorNode} node
     * @return {void}
     */
    visitErrorNode(node) {}

    /**
     * @param {org.antlr.v4.runtime.ParserRuleContext} ctx
     * @return {void}
     */
    enterEveryRule(ctx) {}

    /**
     * @param {org.antlr.v4.runtime.ParserRuleContext} ctx
     * @return {void}
     */
    exitEveryRule(ctx) {}
}


exports = ParseTreeListener;
