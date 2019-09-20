/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.RuleContext');


const Token = goog.require('org.antlr.v4.runtime.Token');
const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');
const Utils = goog.require('org.antlr.v4.runtime.misc.Utils');
const RuleNode = goog.require('org.antlr.v4.runtime.tree.RuleNode');
const ErrorNode = goog.require('org.antlr.v4.runtime.tree.ErrorNode');
const TerminalNode = goog.require('org.antlr.v4.runtime.tree.TerminalNode');

// Hack to resolve cyclic deps issue
const ATNINVALID_ALT_NUMBER = 0; // See ATN.INVALID_ALT_NUMBER

/**
 * @private
 * @param {RuleContext} p
 * @param {Array<string>=} ruleNames
 * @param {RuleContext=} stop
 */
function toString_(p, ruleNames, stop) {
    var s = "[";
    while (p !== null && p !== stop) {
        if (ruleNames == null) {
            if (!p.isEmpty()) {
                s += p.invokingState;
            }
        } else {
            var ri = p.getRuleIndex();
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
 *
 * @implements {RuleNode}
 */
class RuleContext {
    /**
     * @param {RuleContext=} parent
     * @param {number=} invokingState
     */
    constructor(parent, invokingState) {
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
        return ATNINVALID_ALT_NUMBER;
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

    toStringTree(recog) {
        return toStringTree(this, recog);
    }

    /**
     * @param {(org.antlr.v4.runtime.Recognizer<?, ?>|Array<string>)=} ruleNamesOrRecog
     * @param {RuleContext=} stop
     */
    toString(ruleNamesOrRecog, stop) {
        var ruleNames = /** @type {Array<string>} */ (ruleNamesOrRecog);
        if (ruleNamesOrRecog && ruleNamesOrRecog.getRuleNames) {
            ruleNames = /** @type {!org.antlr.v4.runtime.Recognizer<?, ?>} */ (ruleNamesOrRecog).getRuleNames();
        }
        return toString_(this, ruleNames, stop);
    }
}

/**
 * Print out a whole tree in LISP form. {@link #getNodeText} is used on the
 * node payloads to get the text for the nodes.
 *
 * @param {!org.antlr.v4.runtime.tree.Tree} t
 * @param {(org.antlr.v4.runtime.Parser|Array<string>)=} o
 * @return {string}
 */
function toStringTree(t, o) {
    var s = Utils.escapeWhitespace(getNodeText(t, o) || "", false);
    if (t.getChildCount() === 0) return s;
    var res = "";
    res += "(";
    res += Utils.escapeWhitespace(getNodeText(t, o) || "", false);
    res += ' ';
    for (var i = 0; i < t.getChildCount(); i++) {
        if (i > 0) res += ' ';
        var c = /** @type {!org.antlr.v4.runtime.tree.Tree} */ (t.getChild(i));
        res += c ? toStringTree(c, o) : "";
    }
    res += ")";
    return res;
}

/**
 * @param {!org.antlr.v4.runtime.tree.Tree} t
 * @param {(org.antlr.v4.runtime.Parser|Array<string>)=} o
 * @return {?string}
 */
function getNodeText(t, o) {
    if (o && goog.isDef(o.getRuleNames)) {
        o = /** @type {!Array<string>} */ (o.getRuleNames());
    }
    var ruleNames = /** @type {!Array<string>} */ (o);
    if (ruleNames != null) {
        if (t instanceof RuleContext) {
            var ruleIndex = t.getRuleContext().getRuleIndex();
            var ruleName = ruleNames[ruleIndex];
            var altNumber = t.getAltNumber();
            if (altNumber != ATNINVALID_ALT_NUMBER) {
                return ruleName+":"+altNumber;
            }
            return ruleName;
        }
        else if (t instanceof ErrorNode) {
            return t.toString();
        }
        else if (t instanceof TerminalNode) {
            var symbol = t.getSymbol();
            if (symbol != null) {
                return symbol.getText();
            }
        }
    }
    // no recog for rule names
    var payload = t.getPayload();
    if (payload instanceof Token) {
        return payload.getText();
    }
    return payload.toString();
}

RuleContext.toStringTree = toStringTree;

RuleContext.getNodeText = getNodeText;

RuleContext.ATNINVALID_ALT_NUMBER = ATNINVALID_ALT_NUMBER;

exports = RuleContext;
