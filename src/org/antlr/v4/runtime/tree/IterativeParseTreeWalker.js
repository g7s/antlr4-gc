/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.tree.IterativeParseTreeWalker');
goog.module.declareLegacyNamespace();


const ParseTreeWalker = goog.require('org.antlr.v4.runtime.tree.ParseTreeWalker');
const ErrorNode = goog.require('org.antlr.v4.runtime.tree.ErrorNode');
const TerminalNode = goog.require('org.antlr.v4.runtime.tree.TerminalNode');
const RuleNode = goog.require('org.antlr.v4.runtime.tree.RuleNode');

/**
 * An iterative (read: non-recursive) pre-order and post-order tree walker that
 * doesn't use the thread stack but heap-based stacks. Makes it possible to
 * process deeply nested parse trees.
 */
class IterativeParseTreeWalker extends ParseTreeWalker {
    walk(listener, t) {
        /**
         * @type {Array<org.antlr.v4.runtime.tree.ParseTree>}
         */
        var nodeStack = [];
        /**
         * @type {Array<number>}
         */
        var indexStack = [];
        var currentNode = t;
        var currentIndex = 0;
        while (currentNode != null) {
            // pre-order visit
            if (currentNode instanceof ErrorNode) {
                listener.visitErrorNode(/** @type {!ErrorNode} */ (currentNode));
            }
            else if (currentNode instanceof TerminalNode) {
                listener.visitTerminal(/** @type {!TerminalNode} */ (currentNode));
            }
            else {
                this.enterRule(listener, /** @type {!RuleNode} */ (currentNode));
            }

            // Move down to first child, if exists
            if (currentNode.getChildCount() > 0) {
                nodeStack.push(currentNode);
                indexStack.push(currentIndex);
                currentIndex = 0;
                currentNode = currentNode.getChild(0);
                continue;
            }

            // No child nodes, so walk tree
            do {
                // post-order visit
                if (currentNode instanceof RuleNode) {
                    this.exitRule(listener, /** @type {!RuleNode} */ (currentNode));
                }

                // No parent, so no siblings
                if (nodeStack.length === 0) {
                    currentNode = null;
                    currentIndex = 0;
                    break;
                }

                // Move to next sibling if possible
                currentNode = nodeStack[nodeStack.length - 1].getChild(++currentIndex);
                if (currentNode != null) {
                    break;
                }

                // No next, sibling, so move up
                currentNode = nodeStack.pop();
                currentIndex = indexStack.pop();

            } while (currentNode != null);
        }
    }
}


exports = IterativeParseTreeWalker;
