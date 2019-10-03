/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.ParserRuleContext');
goog.module.declareLegacyNamespace();


const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');
const Token = goog.require('org.antlr.v4.runtime.Token');
const RuleContext = goog.require('org.antlr.v4.runtime.RuleContext');
const ErrorNode = goog.require('org.antlr.v4.runtime.tree.ErrorNode');
const ErrorNodeImpl = goog.require('org.antlr.v4.runtime.tree.ErrorNodeImpl');
const TerminalNode = goog.require('org.antlr.v4.runtime.tree.TerminalNode');
const TerminalNodeImpl = goog.require('org.antlr.v4.runtime.tree.TerminalNodeImpl');
const {filter, find} = goog.require('goog.array');

/**
 * A rule invocation record for parsing.
 *
 * Contains all of the information about the current rule not stored in the
 * RuleContext. It handles parse tree children list, Any ATN state
 * tracing, and the default values available for rule invocations:
 * start, stop, rule index, current alt number.
 *
 * Subclasses made for each rule and grammar track the parameters,
 * return values, locals, and labels specific to that rule. These
 * are the objects that are returned from rules.
 *
 * Note text is not an actual field of a rule return value; it is computed
 * from start and stop using the input stream's toString() method.  I
 * could add a ctor to this so that we can pass in and store the input
 * stream, but I'm not sure we want to do that.  It would seem to be undefined
 * to get the .text property anyway if the rule matches tokens from multiple
 * input streams.
 *
 * I do not use getters for fields of objects that are used simply to
 * group values such as this aggregate.  The getters/setters are there to
 * satisfy the superclass interface.
 */
class ParserRuleContext extends RuleContext {
    /**
     * @param {RuleContext=} parent
     * @param {number=} invokingStateNumber
     */
    constructor(parent, invokingStateNumber) {
        super(parent, invokingStateNumber);
        /**
         * If we are debugging or building a parse tree for a visitor,
         * we need to track all of the tokens and rule invocations associated
         * with this rule's context. This is empty for parsing w/o tree constr.
         * operation because we don't the need to track the details about
         * how we parse this rule.
         *
         * @type {!Array<org.antlr.v4.runtime.tree.ParseTree>}
         */
        this.children = [];

        /**
         * For debugging/tracing purposes, we want to track all of the nodes in
         * the ATN traversed by the parser for a particular rule.
         * This list indicates the sequence of ATN nodes used to match
         * the elements of the children list. This list does not include
         * ATN nodes and other rules used to match rule invocations. It
         * traces the rule invocation node itself but nothing inside that
         * other rule's ATN submachine.
         *
         * There is NOT a one-to-one correspondence between the children and
         * states list. There are typically many nodes in the ATN traversed
         * for each element in the children list. For example, for a rule
         * invocation there is the invoking state and the following state.
         *
         * The parser setState() method updates field s and adds it to this list
         * if we are debugging/tracing.
         *
         * This does not trace states visited during prediction.
         *
         * @type {Token}
         */
        this.start = null;
        /**
         * @type {Token}
         */
        this.stop = null;
        /**
         * The exception that forced this rule to return. If the rule successfully
         * completed, this is {@code null}.
         *
         * @type {org.antlr.v4.runtime.RecognitionException}
         */
        this.exception = null;
    }

    /**
     * COPY a ctx (I'm deliberately not using copy constructor) to avoid
     * confusion with creating node with parent. Does not copy children
     * (except error leaves).
     *
     * This is used in the generated parser code to flip a generic XContext
     * node for rule X to a YContext for alt label Y. In that sense, it is
     * not really a generic copy function.
     *
     * If we do an error sync() at start of a rule, we might add error nodes
     * to the generic XContext so this function must copy those nodes to
     * the YContext as well else they are lost!
     *
     * @param {ParserRuleContext} ctx
     * @return {void}
     */
    copyFrom(ctx) {
        this.parent = ctx.parent;
        this.invokingState = ctx.invokingState;
        this.start = ctx.start;
        this.stop = ctx.stop;
        // copy any error nodes to alt label node
        this.children = [];
        // reset parent pointer for any error nodes
        ctx.children.forEach(function (child) {
            if (child instanceof ErrorNodeImpl) {
                this.children.push(child);
            }
        }, this);
    }

    /**
     * Add a parse tree node to this as a child.  Works for
     * internal and leaf nodes. Does not set parent link;
     * other add methods must do that. Other addChild methods
     * call this.
     *
     * We cannot set the parent pointer of the incoming node
     * because the existing interfaces do not have a setParent()
     * method and I don't want to break backward compatibility for this.
     *
     * @since 4.7
     *
     * @template T
     * @param {T} child
     * @return {T}
    */
    addAnyChild(child) {
        this.children.push(child);
        return child;
    }

    /**
     * @param {RuleContext|TerminalNode} child
     * @return {RuleContext|TerminalNode}
     */
    addChild(child) {
        if (child instanceof TerminalNodeImpl) {
            child.setParent(this);
        }
        return this.addAnyChild(child);
    }

    /**
     * Add an error node child and force its parent to be this node.
     *
     * @since 4.7
     *
     * @param {ErrorNode} errorNode
     * @return {ErrorNode}
     */
    addErrorNode(errorNode) {
        errorNode.setParent(this);
        return this.addAnyChild(errorNode);
    }

    /**
     * Used by enterOuterAlt to toss out a RuleContext previously added as
     * we entered a rule. If we have # label, we will need to remove
     * generic ruleContext object.
     *
     * @return {void}
     */
    removeLastChild() {
        this.children.pop();
    }

    /**
     * @param {org.antlr.v4.runtime.tree.ParseTreeListener} listener
     * @return {void}
     */
    enterRule(listener) {}

    /**
     * @param {org.antlr.v4.runtime.tree.ParseTreeListener} listener
     * @return {void}
     */
    exitRule(listener) {}

    getParent() {
        return super.getParent();
    }

    /**
     * @override
     * @param {!Function|number} ctxTypeOrIndex
     * @param {number=} i
     * @return {org.antlr.v4.runtime.tree.ParseTree}
     */
    getChild(ctxTypeOrIndex, i) {
        if (!goog.isDef(i)) {
            var j = /** @type {number} */ (ctxTypeOrIndex);
            return this.children[j] || null;
        }
        var ctxType = /** @type {!Function} */ (ctxTypeOrIndex);
        return find(this.children, function (child) {
            return child instanceof ctxType && i-- === 0;
        }) || null;
    }

    /**
     * @param {number} ttype
     * @param {number} i
     * @return {TerminalNode}
     */
    getToken(ttype, i) {
        if (i < 0 || i >= this.children.length) {
            return null;
        }
        var found = find(this.children, function (child) {
            return child instanceof TerminalNodeImpl && /** @type {TerminalNode} */ (child).getSymbol().getType() === ttype && i-- === 0;
        }) || null;
        return /** @type {TerminalNode} */ (found);
    }

    /**
     * @param {number} ttype
     * @return {!Array<TerminalNode>}
     */
    getTokens(ttype) {
        var filtered = filter(this.children, function (child) {
            return child instanceof TerminalNodeImpl && /** @type {TerminalNode} */ (child).getSymbol().getType() === ttype;
        });
        return /** @type {!Array<TerminalNode>} */ (filtered);
    }

    /**
     * @param {!Function} ctxType
     * @param {number} i
     * @return {ParserRuleContext}
     */
    getRuleContext(ctxType, i) {
        return /** @type {ParserRuleContext} */ (this.getChild(ctxType, i));
    }

    /**
     * @param {!Function} ctxType
     * @return {!Array<ParserRuleContext>}
     */
    getRuleContexts(ctxType) {
        return filter(this.children, function (child) {
            return child instanceof ctxType;
        });
    }

    getChildCount() {
        return this.children.length;
    }

    getSourceInterval() {
        if (this.start === null) {
            return Interval.INVALID;
        }
        if (this.stop === null || this.stop.getTokenIndex() < this.start.getTokenIndex()) {
            return Interval.of(this.start.getTokenIndex(), this.start.getTokenIndex() - 1);
        }
        return Interval.of(this.start.getTokenIndex(), this.stop.getTokenIndex());
    }

    /**
     * Get the initial token in this context.
     * Note that the range from start to stop is inclusive, so for rules that do not consume anything
     * (for example, zero length or error productions) this token may exceed stop.
     *
     * @return {Token}
     */
    getStart() {
        return this.start;
    }

    /**
     * Get the final token in this context.
     * Note that the range from start to stop is inclusive, so for rules that do not consume anything
     * (for example, zero length or error productions) this token may precede start.
     *
     * @return {Token}
     */
    getStop() {
        return this.stop;
    }

    /**
     * Used for rule context info debugging during parse-time, not so much for ATN debugging
     *
     * @param {org.antlr.v4.runtime.Parser} recognizer
     * @return {string}
     */
    toInfoString(recognizer) {
        let rules = recognizer.getRuleInvocationStack(this);
        return "ParserRuleContext"+rules.reverse()+"{" +
            "start=" + this.start +
            ", stop=" + this.stop +
            '}';
    }
}

ParserRuleContext.EMPTY = new ParserRuleContext();


exports = ParserRuleContext;
