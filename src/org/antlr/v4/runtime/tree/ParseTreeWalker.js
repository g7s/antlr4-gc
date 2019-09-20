/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.tree.ParseTreeWalker');


const ErrorNode = goog.require('org.antlr.v4.runtime.tree.ErrorNode');
const TerminalNode = goog.require('org.antlr.v4.runtime.tree.TerminalNode');

class ParseTreeWalker {
    /**
     * @param {org.antlr.v4.runtime.tree.ParseTreeListener} listener
     * @param {org.antlr.v4.runtime.tree.ParseTree} t
     * @return {void}
     */
    walk(listener, t) {
		if (t instanceof ErrorNode) {
			listener.visitErrorNode(t);
			return;
		}
		else if (t instanceof TerminalNode) {
			listener.visitTerminal(t);
			return;
		}
        this.enterRule(listener, t);
        var n = t.getChildCount();
        for (var i = 0; i < n; i++) {
            this.walk(listener, t.getChild(i));
        }
		this.exitRule(listener, t);
    }

	/**
	 * The discovery of a rule node, involves sending two events: the generic
	 * {@link ParseTreeListener#enterEveryRule} and a
	 * {@link RuleContext}-specific event. First we trigger the generic and then
	 * the rule specific. We to them in reverse order upon finishing the node.
     *
     * @protected
     * @param {org.antlr.v4.runtime.tree.ParseTreeListener} listener
     * @param {org.antlr.v4.runtime.tree.RuleNode} r
     * @return {void}
	 */
    enterRule(listener, r) {
        var ctx = /** @type {ParserRuleContext} */ (r.getRuleContext());
        listener.enterEveryRule(ctx);
        ctx.enterRule(listener);
    }

    /**
     * @protected
     * @param {org.antlr.v4.runtime.tree.ParseTreeListener} listener
     * @param {org.antlr.v4.runtime.tree.RuleNode} r
     * @return {void}
     */
    exitRule(listener, r) {
        var ctx = /** @type {ParserRuleContext} */ (r.getRuleContext());
        ctx.exitRule(listener);
        listener.exitEveryRule(ctx);
    }
}

ParseTreeWalker.DEFAULT = new ParseTreeWalker();


exports = ParseTreeWalker;
