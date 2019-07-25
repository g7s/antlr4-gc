/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.RuleContext');


const ATN = goog.require('org.antlr.v4.runtime.atn.ATN');
const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');
const RuleNode = goog.require('org.antlr.v4.runtime.tree.RuleNode');
const {toStringTree} = goog.require('org.antlr.v4.runtime.tree.Trees');

/**
 * @private
 * @param {RuleContext} p
 * @param {Array.<string>} ruleNames
 * @param {RuleContext} stop
 */
function toString_(p, ruleNames, stop) {
    var s = "[";
    while (p !== null && p !== stop) {
        if (ruleNames === null) {
            if (!p.isEmpty()) {
                s += p.invokingState;
            }
        } else {
            var ri = p.ruleIndex;
            var ruleName = (ri >= 0 && ri < ruleNames.length) ? ruleNames[ri]
                    : "" + ri;
            s += ruleName;
        }
        if (p.parent !== null && (ruleNames !== null || !p.parent.isEmpty())) {
            s += " ";
        }
        p = p.parent;
    }
    s += "]";
    return s;
}

/**
 * A rule context is a record of a single rule invocation.
 *
 * We form a stack of these context objects using the parent
 * pointer. A parent pointer of null indicates that the current
 * context is the bottom of the stack. The ParserRuleContext subclass
 * as a children list so that we can turn this data structure into a
 * tree.
 *
 * The root node always has a null pointer and invokingState of -1.
 *
 * Upon entry to parsing, the first invoked rule function creates a
 * context object (a subclass specialized for that rule such as
 * SContext) and makes it the root of a parse tree, recorded by field
 * Parser._ctx.
 *
 * public final SContext s() throws RecognitionException {
 *     SContext _localctx = new SContext(_ctx, getState()); <-- create new node
 *     enterRule(_localctx, 0, RULE_s);                     <-- push it
 *     ...
 *     exitRule();                                          <-- pop back to _localctx
 *     return _localctx;
 * }
 *
 * A subsequent rule invocation of r from the start rule s pushes a
 * new context object for r whose parent points at s and use invoking
 * state is the state with r emanating as edge label.
 *
 * The invokingState fields from a context object to the root
 * together form a stack of rule indication states where the root
 * (bottom of the stack) has a -1 sentinel value. If we invoke start
 * symbol s then call r1, which calls r2, the  would look like
 * this:
 *
 *    SContext[-1]   <- root node (bottom of the stack)
 *    R1Context[p]   <- p in rule s called r1
 *    R2Context[q]   <- q in rule r1 called r2
 *
 * So the top of the stack, _ctx, represents a call to the current
 * rule and it holds the return address from another rule that invoke
 * to this rule. To invoke a rule, we must always have a current context.
 *
 * The parent contexts are useful for computing lookahead sets and
 * getting error information.
 *
 * These objects are used during parsing and prediction.
 * For the special case of parsers, we use the subclass
 * ParserRuleContext.
 *
 * @see ParserRuleContext
 */
class RuleContext extends RuleNode {
    /**
     * @param {RuleContext=} parent
     * @param {number=} invokingState
     */
    constructor(parent, invokingState) {
        RuleNode.call(this);
        /**
         * What context invoked this rule?
         * @type {RuleContext}
         */
        this.parent = parent || null;
        /**
         * What state invoked the rule associated with this context?
         * The "return address" is the followState of invokingState
         * If parent is null, this should be -1 this context object represents
         * the start rule.
         * @type {number}
         */
        this.invokingState = invokingState || -1;
    }

    /**
     * @return {number}
     */
    depth() {
        var n = 0;
        var p = this;
        while (p !== null) {
            p = p.parent;
            n++;
        }
        return n;
    }

    /**
     * A context is empty if there is no invoking state; meaning nobody called
     * current context.
     *
     * @return {boolean}
     */
    isEmpty() {
        return this.invokingState == -1;
    }

    // satisfy the ParseTree / SyntaxTree interface

    getSourceInterval() {
        return Interval.INVALID;
    }

    getRuleContext() {
        return this;
    }

    getParent() {
        return this.parent;
    }

    getPayload() {
        return this;
    }

    /**
     * Return the combined text of all child nodes. This method only considers
     * tokens which have been added to the parse tree.
     * <p>
     * Since tokens on hidden channels (e.g. whitespace or comments) are not
     * added to the parse trees, they will not appear in the output of this
     * method.
     */
    getText() {
        let childCount = this.getChildCount();
        if (childCount == 0) {
            return "";
        }
        var str = "";
        for (var i = 0; i < childCount; i++) {
            str += this.getChild(i).getText();
        }
        return str;
    }

    /**
     * @return {number}
     */
    getRuleIndex() {
        return -1;
    }

    /**
     * For rule associated with this parse tree internal node, return
     * the outer alternative number used to match the input. Default
     * implementation does not compute nor store this alt num. Create
     * a subclass of ParserRuleContext with backing field and set
     * option contextSuperClass.
     * to set it.
     *
     * @since 4.5.3
     *
     * @return {number}
     */
    getAltNumber() {
        return ATN.INVALID_ALT_NUMBER;
    }

    /**
     * Set the outer alternative number for this context node. Default
     * implementation does nothing to avoid backing field overhead for
     * trees that don't need it.  Create
     * a subclass of ParserRuleContext with backing field and set
     * option contextSuperClass.
     *
     * @since 4.5.3
     *
     * @param {number} altNumber
     * @return {void}
     */
    setAltNumber(altNumber) {}

    /** @since 4.7. {@see ParseTree#setParent} comment */
    setParent(parent) {
        this.parent = parent;
    }

    getChild(i) {
        return null;
    }

    getChildCount() {
        return 0;
    }

    accept(visitor) {
        return visitor.visitChildren(this);
    }

    /**
     * Print out a whole tree, not just a node, in LISP format
     * (root child1 .. childN). Print just a node if this is a leaf.
     * We have to know the recognizer so we can get rule names.
     */
    toStringTree(recog) {
        return toStringTree(this, goog.isDef(recog) ? recog : null);
    }

    toString(ruleNamesOrRecog, stop) {
        var ruleNames = ruleNamesOrRecog;
        if (ruleNamesOrRecog && ruleNamesOrRecog.getRuleNames) {
            ruleNames = ruleNamesOrRecog.getRuleNames();
        }
        return toString_(this, ruleNames || null, stop || null);
    }
};


exports = RuleContext;
