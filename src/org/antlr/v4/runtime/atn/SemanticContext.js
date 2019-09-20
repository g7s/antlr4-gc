/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.SemanticContext');


const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');
const {equals: arrEquals, filter} = goog.require('goog.array');

/** A tree structure used to record the semantic context in which
 *  an ATN configuration is valid.  It's either a single predicate,
 *  a conjunction {@code p1&&p2}, or a sum of products {@code p1||p2}.
 *
 *  <p>I have scoped the {@link AND}, {@link OR}, and {@link Predicate} subclasses of
 *  {@link SemanticContext} within the scope of this outer class.</p>
 *
 * @abstract
 */
class SemanticContext {
    /**
     * For context independent predicates, we evaluate them without a local
     * context (i.e., null context). That way, we can evaluate them without
     * having to create proper rule-specific context during prediction (as
     * opposed to the parser, which creates them naturally). In a practical
     * sense, this avoids a cast exception from RuleContext to myruleContext.
     *
     * <p>For context dependent predicates, we must pass in a local context so that
     * references such as $arg evaluate properly as _localctx.arg. We only
     * capture context dependent predicates in the context in which we begin
     * prediction, so we passed in the outer context here in case of context
     * dependent predicate evaluation.</p>
     *
     * @abstract
     * @param {org.antlr.v4.runtime.Recognizer<?, ?>} parser
     * @param {org.antlr.v4.runtime.RuleContext} parserCallStack
     * @return {boolean}
     */
    eval(parser, parserCallStack) {}

    /**
     * Evaluate the precedence predicates for the context and reduce the result.
     *
     * @param {org.antlr.v4.runtime.Recognizer<?, ?>} parser The parser instance.
     * @param {org.antlr.v4.runtime.RuleContext} parserCallStack
     * @return {SemanticContext} The simplified semantic context after precedence predicates are
     * evaluated, which will be one of the following values.
     * <ul>
     * <li>{@link #NONE}: if the predicate simplifies to {@code true} after
     * precedence predicates are evaluated.</li>
     * <li>{@code null}: if the predicate simplifies to {@code false} after
     * precedence predicates are evaluated.</li>
     * <li>{@code this}: if the semantic context is not changed as a result of
     * precedence predicate evaluation.</li>
     * <li>A non-{@code null} {@link SemanticContext}: the new simplified
     * semantic context after precedence predicates are evaluated.</li>
     * </ul>
     */
    evalPrecedence(parser, parserCallStack) {
        return this;
    }

    /**
     * @abstract
     * @return {number}
     */
    hashCode() {}

    /**
     * @abstract
     * @param {Object} o
     * @return {boolean}
     */
    equals(o) {}
}

class SemanticContext$Predicate extends SemanticContext {
    /**
     * @param {number=} ruleIndex
     * @param {number=} predIndex
     * @param {boolean=} isCtxDependent
     */
    constructor(ruleIndex, predIndex, isCtxDependent) {
        super();
        /**
         * @type {number}
         */
        this.ruleIndex = ruleIndex == null ? -1 : ruleIndex;
        /**
         * @type {number}
         */
        this.predIndex = predIndex == null ? -1 : predIndex;
        /**
         * @type {boolean}
         */
        this.isCtxDependent = isCtxDependent == null ? false : isCtxDependent;
    }

    eval(parser, parserCallStack) {
        var localctx = this.isCtxDependent ? parserCallStack : null;
        return parser.sempred(localctx, this.ruleIndex, this.predIndex);
    }

    /**
     * @return {number}
     */
    hashCode() {
        var hashCode = MurmurHash.initialize();
        hashCode = MurmurHash.update(hashCode, this.ruleIndex);
        hashCode = MurmurHash.update(hashCode, this.predIndex);
        hashCode = MurmurHash.update(hashCode, this.isCtxDependent ? 1 : 0);
        hashCode = MurmurHash.finish(hashCode, 3);
        return hashCode;
    }

    /**
     * @param {Object} obj
     * @return {boolean}
     */
    equals(obj) {
        if (!(obj instanceof SemanticContext$Predicate)) return false;
        if (this === obj) return true;
        return this.ruleIndex === obj.ruleIndex &&
               this.predIndex === obj.predIndex &&
               this.isCtxDependent === obj.isCtxDependent;
    }

    /**
     * @return {string}
     */
    toString() {
        return "{" + this.ruleIndex + ":" + this.predIndex + "}?";
    }
}

class SemanticContext$PrecedencePredicate extends SemanticContext {
    /**
     * @param {number=} precedence
     */
    constructor(precedence) {
        super();
        /**
         * @type {number}
         */
        this.precedence = precedence || 0;
    }

    eval(parser, parserCallStack) {
        return parser.precpred(parserCallStack, this.precedence);
    }

    evalPrecedence(parser, parserCallStack) {
        if (parser.precpred(parserCallStack, this.precedence)) {
            return SemanticContext.NONE;
        }
        else {
            return null;
        }
    }

    /**
     * @param {!SemanticContext$PrecedencePredicate} o
     * @return {number}
     */
    compareTo(o) {
        return this.precedence - o.precedence;
    }

    /**
     * @return {number}
     */
    hashCode() {
        var hashCode = 1;
        hashCode = 31 * hashCode + this.precedence;
        return hashCode;
    }

    /**
     * @param {Object} obj
     * @return {boolean}
     */
    equals(obj) {
        if (!(obj instanceof SemanticContext$PrecedencePredicate)) {
            return false;
        }
        if (this === obj) {
            return true;
        }
        return this.precedence === obj.precedence;
    }

    /**
     * @return {string}
     */
    toString() {
        return "{" + this.precedence + ">=prec}?";
    }
}

/**
 * This is the base class for semantic context "operators", which operate on
 * a collection of semantic context "operands".
 *
 * @since 4.3
 *
 * @abstract
 */
class SemanticContext$Operator extends SemanticContext {
    /**
     * Gets the operands for the semantic context operator.
     *
     * @abstract
     * @return {Array<SemanticContext>} a collection of {@link SemanticContext} operands for the
     * operator.
     *
     * @since 4.3
     */
    getOperands() {}
}

/**
 * A semantic context which is true whenever none of the contained contexts
 * is false.
 */
class SemanticContext$AND extends SemanticContext$Operator {
    /**
     * @param {!SemanticContext} a
     * @param {!SemanticContext} b
     */
    constructor(a, b) {
        super();
        /**
         * @type {!Array<!SemanticContext>}
         */
        var operands = [];
        if (a instanceof SemanticContext$AND) {
            operands = operands.concat(a.opnds);
        } else {
            operands.push(a);
        }
        if (b instanceof SemanticContext$AND) {
            operands = operands.concat(b.opnds);
        } else {
            operands.push(b);
        }
        var precedencePredicates = SemanticContext.filterPrecedencePredicates(operands);
        if (precedencePredicates.length > 0) {
            // interested in the transition with the lowest precedence
            var sorted = precedencePredicates.sort((a, b) => a.compareTo(b));
            operands.push(sorted[0]);
        }
        /**
         * @type {!Array<!SemanticContext>}
         */
        this.opnds = operands;
    }

    getOperands() {
        return this.opnds;
    }

    /**
     * @param {Object} obj
     * @return {boolean}
     */
    equals(obj) {
        if (this === obj) return true;
        if (!(obj instanceof SemanticContext$AND)) return false;
        return arrEquals(this.opnds, obj.opnds, (a, b) => a.equals(b));
    }

    /**
     * @return {number}
     */
    hashCode() {
        return MurmurHash.hashCode(this.opnds, SemanticContext$AND.HASH_SEED);
    }

    eval(parser, parserCallStack) {
        for (const opnd of this.opnds) {
            if (!opnd.eval(parser, parserCallStack)) return false;
        }
        return true;
    }

    evalPrecedence(parser, parserCallStack) {
        var differs = 0;
        /**
         * @type {!Array<!SemanticContext>}
         */
        var operands = [];
        for (const context of this.opnds) {
            var evaluated = context.evalPrecedence(parser, parserCallStack);
            differs |= !(!evaluated || evaluated.equals(context));
            if (evaluated == null) {
                // The AND context is false if any element is false
                return null;
            }
            else if (evaluated !== SemanticContext.NONE) {
                // Reduce the result by skipping true elements
                operands.push(evaluated);
            }
        }
        if (!differs) {
            return this;
        }
        if (operands.length === 0) {
            // all elements were true, so the AND context is true
            return SemanticContext.NONE;
        }
        var result = operands[0];
        for (var i = 1; i < operands.length; i++) {
            result = SemanticContext.and(result, operands[i]);
        }
        return result;
    }

    /**
     * @return {string}
     */
    toString() {
        return this.opnds.map(e => e.toString()).join("&&");
    }
}

/**
 * A semantic context which is true whenever at least one of the contained
 * contexts is true.
 */
class SemanticContext$OR extends SemanticContext$Operator {
    /**
     * @param {!SemanticContext} a
     * @param {!SemanticContext} b
     */
    constructor(a, b) {
        super();
        /**
         * @type {!Array<!SemanticContext>}
         */
        var operands = [];
        if (a instanceof SemanticContext$OR) {
            operands = operands.concat(a.opnds);
        } else {
            operands.push(a);
        }
        if (b instanceof SemanticContext$OR) {
            operands = operands.concat(b.opnds);
        } else {
            operands.push(b);
        }
        var precedencePredicates = SemanticContext.filterPrecedencePredicates(operands);
        if (precedencePredicates.length > 0) {
            var sorted = precedencePredicates.sort((a, b) => -a.compareTo(b));
            operands.push(sorted[0]);
        }
        /**
         * @type {!Array<!SemanticContext>}
         */
        this.opnds = operands;
    }

    getOperands() {
        return this.opnds;
    }

    /**
     * @param {Object} obj
     * @return {boolean}
     */
    equals(obj) {
        if (this === obj) return true;
        if (!(obj instanceof SemanticContext$OR)) return false;
        return arrEquals(this.opnds, obj.opnds, (a, b) => a.equals(b));
    }

    /**
     * @return {number}
     */
    hashCode() {
        return MurmurHash.hashCode(this.opnds, SemanticContext$OR.HASH_SEED);
    }

    eval(parser, parserCallStack) {
        for (const opnd of this.opnds) {
            if (opnd.eval(parser, parserCallStack)) return true;
        }
        return false;
    }

    evalPrecedence(parser, parserCallStack) {
        var differs = 0;
        /**
         * @type {!Array<!SemanticContext>}
         */
        var operands = [];
        for (const context of this.opnds) {
            var evaluated = context.evalPrecedence(parser, parserCallStack);
            differs |= !(!evaluated || evaluated.equals(context));
            if (evaluated == null) {
                // The AND context is false if any element is false
                return null;
            }
            else if (evaluated !== SemanticContext.NONE) {
                // Reduce the result by skipping true elements
                operands.push(evaluated);
            }
        }
        if (!differs) {
            return this;
        }
        if (operands.length === 0) {
            // all elements were true, so the AND context is true
            return SemanticContext.NONE;
        }
        var result = operands[0];
        for (var i = 1; i < operands.length; i++) {
            result = SemanticContext.or(result, operands[i]);
        }
        return result;
    }

    /**
     * @return {string}
     */
    toString() {
        return this.opnds.map(e => e.toString()).join("||");
    }
}

/**
 * @private {number}
 */
SemanticContext$AND.HASH_SEED = Math.floor(Math.random() * Math.floor(1000));

/**
 * @private {number}
 */
SemanticContext$OR.HASH_SEED = Math.floor(Math.random() * Math.floor(1000));

/**
 * The default {@link SemanticContext}, which is semantically equivalent to
 * a predicate of the form {@code {true}?}.
 *
 * @type {SemanticContext$Predicate}
 */
SemanticContext.NONE = new SemanticContext$Predicate();

/**
 * @param {SemanticContext} a
 * @param {SemanticContext} b
 * @return {SemanticContext}
 */
SemanticContext.and = function (a, b) {
    if (a === null || a === SemanticContext.NONE) return b;
    if (b === null || b === SemanticContext.NONE) return a;
    var result = new SemanticContext$AND(a, b);
    if (result.opnds.length === 1) {
        return result.opnds[0];
    }
    return result;
};

/**
 * @see ParserATNSimulator#getPredsForAmbigAlts
 *
 * @param {SemanticContext} a
 * @param {SemanticContext} b
 * @return {SemanticContext}
 */
SemanticContext.or = function (a, b) {
    if (a === null || a === SemanticContext.NONE) return b;
    if (b === null || b === SemanticContext.NONE) return a;
    var result = new SemanticContext$OR(a, b);
    if (result.opnds.length === 1) {
        return result.opnds[0];
    }
    return result;
};

/**
 * @private
 * @param {Array<SemanticContext>} collection
 * @return {!Array<!SemanticContext$PrecedencePredicate>}
 */
SemanticContext.filterPrecedencePredicates = function (collection) {
    return filter(collection, ctx => ctx instanceof SemanticContext$PrecedencePredicate);
};

exports = SemanticContext;
exports.Predicate = SemanticContext$Predicate;
exports.PrecedencePredicate = SemanticContext$PrecedencePredicate;
exports.Operator = SemanticContext$Operator;
exports.AND = SemanticContext$AND;
exports.OR = SemanticContext$OR;
