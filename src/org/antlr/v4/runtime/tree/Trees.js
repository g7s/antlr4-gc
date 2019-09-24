/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/**
 * A set of utility routines useful for all kinds of ANTLR trees.
 */
goog.module('org.antlr.v4.runtime.tree.Trees');
goog.module.declareLegacyNamespace();


const Token = goog.require('org.antlr.v4.runtime.Token');
const CommonToken = goog.require('org.antlr.v4.runtime.CommonToken');
const ParserRuleContext = goog.require('org.antlr.v4.runtime.ParserRuleContext');
const RuleContext = goog.require('org.antlr.v4.runtime.RuleContext');
const ErrorNode = goog.require('org.antlr.v4.runtime.tree.ErrorNode');
const TerminalNode = goog.require('org.antlr.v4.runtime.tree.TerminalNode');
const TerminalNodeImpl = goog.require('org.antlr.v4.runtime.tree.TerminalNodeImpl');
const ATN = goog.require('org.antlr.v4.runtime.atn.ATN');
const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');
// const Predicate = goog.require('org.antlr.v4.runtime.misc.Predicate');

/**
 * Return ordered list of all children of this node
 *
 * @param {org.antlr.v4.runtime.tree.Tree} t
 * @return {Array<org.antlr.v4.runtime.tree.Tree>}
 */
function getChildren(t) {
    /**
     * @type {Array<org.antlr.v4.runtime.tree.Tree>}
     */
    var kids = [];
    for (var i = 0; i < t.getChildCount(); i++) {
        kids.push(t.getChild(i));
    }
    return kids;
}

/**
 * Return a list of all ancestors of this node.  The first node of
 * list is the root and the last is the parent of this node.
 *
 * @since 4.5.1
 *
 * @param {!org.antlr.v4.runtime.tree.Tree} t
 * @return {!Array<org.antlr.v4.runtime.tree.Tree>}
 */
function getAncestors(t) {
    if (t.getParent() == null) return [];
    /**
     * @type {!Array<org.antlr.v4.runtime.tree.Tree>}
     */
    var ancestors = [];
    /**
     * @type {org.antlr.v4.runtime.tree.Tree}
     */
    var p = t.getParent();
    while (p != null) {
        ancestors.unshift(p); // insert at start
        p = p.getParent();
    }
    return ancestors;
}

/**
 * Return true if t is u's parent or a node on path to root from u.
 * Use == not equals().
 *
 * @since 4.5.1
 *
 * @param {org.antlr.v4.runtime.tree.Tree} t
 * @param {org.antlr.v4.runtime.tree.Tree} u
 * @return {boolean}
 */
function isAncestorOf(t, u) {
    if (t == null || u == null || t.getParent() == null) return false;
    var p = u.getParent();
    while (p != null) {
        if (t == p) return true;
        p = p.getParent();
    }
    return false;
}

/**
 * @param {org.antlr.v4.runtime.tree.ParseTree} t
 * @param {number} ttype
 * @return {Array<org.antlr.v4.runtime.tree.ParseTree>}
 */
function findAllTokenNodes(t, ttype) {
    return findAllNodes(t, ttype, true);
}

/**
 * @param {org.antlr.v4.runtime.tree.ParseTree} t
 * @param {number} ruleIndex
 * @return {Array<org.antlr.v4.runtime.tree.ParseTree>}
 */
function findAllRuleNodes(t, ruleIndex) {
    return findAllNodes(t, ruleIndex, false);
}

/**
 * @param {org.antlr.v4.runtime.tree.ParseTree} t
 * @param {number} index
 * @param {boolean} findTokens
 * @return {Array<org.antlr.v4.runtime.tree.ParseTree>}
 */
function findAllNodes(t, index, findTokens) {
    /**
     * @type {Array<org.antlr.v4.runtime.tree.ParseTree>}
     */
    var nodes = [];
    _findAllNodes(t, index, findTokens, nodes);
    return nodes;
}

/**
 * @param {org.antlr.v4.runtime.tree.ParseTree} t
 * @param {number} index
 * @param {boolean} findTokens
 * @param {Array} nodes
 * @return {void}
 */
function _findAllNodes(t, index, findTokens, nodes) {
    // check this node (the root) first
    if (findTokens && t instanceof TerminalNode) {
        if (t.getSymbol().getType() === index) nodes.push(t);
    }
    else if (!findTokens && t instanceof ParserRuleContext) {
        if (t.getRuleIndex() === index) nodes.push(t);
    }
    // check children
    for (var i = 0; i < t.getChildCount(); i++){
        _findAllNodes(t.getChild(i), index, findTokens, nodes);
    }
}

/**
 * Get all descendents; includes t itself.
 *
 * @since 4.5.1
 *
 * @param {org.antlr.v4.runtime.tree.ParseTree} t
 * @return {Array<org.antlr.v4.runtime.tree.ParseTree>}
 */
function getDescendants(t) {
    /**
     * @type {Array<org.antlr.v4.runtime.tree.ParseTree>}
     */
    var nodes = [t];
    var n = t.getChildCount();
    for (var i = 0 ; i < n ; i++){
        nodes = nodes.concat(getDescendants(t.getChild(i)));
    }
    return nodes;
}

/**
 * @deprecated
 *
 * @param {org.antlr.v4.runtime.tree.ParseTree} t
 * @return {Array<org.antlr.v4.runtime.tree.ParseTree>}
 */
function descendants(t) {
    return getDescendants(t);
}

/**
 * Find smallest subtree of t enclosing range startTokenIndex..stopTokenIndex
 * inclusively using postorder traversal.  Recursive depth-first-search.
 *
 * @since 4.5.1
 *
 * @param {org.antlr.v4.runtime.tree.ParseTree} t
 * @param {number} startTokenIndex
 * @param {number} stopTokenIndex
 * @return {ParserRuleContext}
 */
function getRootOfSubtreeEnclosingRegion(t, startTokenIndex, stopTokenIndex) {
    var n = t.getChildCount();
    for (var i = 0; i < n; i++) {
        var child = t.getChild(i);
        var r = getRootOfSubtreeEnclosingRegion(child, startTokenIndex, stopTokenIndex);
        if (r != null) return r;
    }
    if (t instanceof ParserRuleContext) {
        if (startTokenIndex >= t.getStart().getTokenIndex() && // is range fully contained in t?
                (t.getStop() == null || stopTokenIndex <= t.getStop().getTokenIndex())) {
            // note: r.getStop()==null likely implies that we bailed out of parser and there's nothing to the right
            return t;
        }
    }
    return null;
}

/** Replace any subtree siblings of root that are completely to left
 *  or right of lookahead range with a CommonToken(Token.INVALID_TYPE,"...")
 *  node. The source interval for t is not altered to suit smaller range!
 *
 *  WARNING: destructive to t.
 *
 *  @since 4.5.1
 *
 * @param {ParserRuleContext} t
 * @param {ParserRuleContext} root
 * @param {number} startIndex
 * @param {number} stopIndex
 * @return {void}
 */
function stripChildrenOutOfRange(t, root, startIndex, stopIndex) {
    if (t == null) return;
    for (var i = 0; i < t.getChildCount(); i++) {
        var child = t.getChild(i);
        var range = child.getSourceInterval();
        if (child instanceof ParserRuleContext && (range.b < startIndex || range.a > stopIndex)) {
            if (isAncestorOf(child, root)) { // replace only if subtree doesn't have displayed root
                var abbrev = new CommonToken(Token.INVALID_TYPE, "...");
                t.children[i] = new TerminalNodeImpl(abbrev);
            }
        }
    }
}

// /**
//  * Return first node satisfying the pred
//  *
//  * @since 4.5.1
//  *
//  * @param {org.antlr.v4.runtime.tree.Tree} t
//  * @param {Predicate<org.antlr.v4.runtime.tree.Tree>} pred
//  * @return {org.antlr.v4.runtime.tree.Tree}
//  */
// function findNodeSuchThat(t, pred) {
//     if (pred.test(t)) return t;
//     if (t === null) return null;
//     var n = t.getChildCount();
//     for (var i = 0; i < n; i++){
//         var u = findNodeSuchThat(t.getChild(i), pred);
//         if (u !== null) return u;
//     }
//     return null;
// }


exports = {
    toStringTree: RuleContext.toStringTree,
    getNodeText: RuleContext.getNodeText,
    getChildren,
    getAncestors,
    isAncestorOf,
    findAllTokenNodes,
    findAllRuleNodes,
    findAllNodes,
    _findAllNodes,
    getDescendants,
    descendants,
    getRootOfSubtreeEnclosingRegion,
    stripChildrenOutOfRange,
    // findNodeSuchThat,
};
