/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.tree.ParseTreeVisitor');


/**
 * This interface defines the basic notion of a parse tree visitor. Generated
 * visitors implement this interface and the {@code XVisitor} interface for
 * grammar {@code X}.
 *
 * @template T
 */
class ParseTreeVisitor {
	/**
	 * Visit a parse tree, and return a user-defined result of the operation.
	 *
	 * @param {org.antlr.v4.runtime.tree.ParseTree} tree The {@link ParseTree} to visit.
	 * @return {T} The result of visiting the parse tree.
	 */
	visit(tree) {}

	/**
	 * Visit the children of a node, and return a user-defined result of the
	 * operation.
	 *
	 * @param {org.antlr.v4.runtime.tree.RuleNode} node The {@link RuleNode} whose children should be visited.
	 * @return {T} The result of visiting the children of the node.
	 */
	visitChildren(node) {}

	/**
	 * Visit a terminal node, and return a user-defined result of the operation.
	 *
	 * @param {org.antlr.v4.runtime.tree.TerminalNode} node The {@link TerminalNode} to visit.
	 * @return {T} The result of visiting the node.
	 */
	visitTerminal(node) {}

	/**
	 * Visit an error node, and return a user-defined result of the operation.
	 *
	 * @param {org.antlr.v4.runtime.tree.ErrorNode} node The {@link ErrorNode} to visit.
	 * @return {T} The result of visiting the node.
	 */
	visitErrorNode(node) {}
}


exports = ParseTreeVisitor;
