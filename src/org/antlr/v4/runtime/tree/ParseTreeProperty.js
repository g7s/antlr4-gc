/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.tree.ParseTreeProperty');
goog.module.declareLegacyNamespace();


/**
 * Associate a property with a parse tree node. Useful with parse tree listeners
 * that need to associate values with particular tree nodes, kind of like
 * specifying a return value for the listener event method that visited a
 * particular node. Example:
 *
 * <pre>
 * ParseTreeProperty&lt;Integer&gt; values = new ParseTreeProperty&lt;Integer&gt;();
 * values.put(tree, 36);
 * int x = values.get(tree);
 * values.removeFrom(tree);
 * </pre>
 *
 * You would make one decl (values here) in the listener and use lots of times
 * in your event methods.
 *
 * @template V
 */
class ParseTreeProperty {
    constructor() {
        /**
         * @protected {WeakMap.<org.antlr.v4.runtime.tree.ParseTree, V>}
         */
        this.annotations = new WeakMap();
    }

    /**
     * @param {org.antlr.v4.runtime.tree.ParseTree} node
     * @return {V}
     */
    get(node) {
        return this.annotations.get(node);
    }

    /**
     * @param {org.antlr.v4.runtime.tree.ParseTree} node
     * @param {V} value
     * @return {void}
     */
    put(node, value) {
        this.annotations.set(node, value);
    }

    /**
     * @param {org.antlr.v4.runtime.tree.ParseTree} node
     * @return {V}
     */
    removeFrom(node) {
        return this.annotations.delete(node);
    }
}


exports = ParseTreeProperty;
