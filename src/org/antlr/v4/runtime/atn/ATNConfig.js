/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.ATNConfig');


const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');
const SemanticContext = goog.require('org.antlr.v4.runtime.atn.SemanticContext');
const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');

/**
 * A tuple: (ATN state, predicted alt, syntactic, semantic context).
 * The syntactic context is a graph-structured stack node whose
 * path(s) to the root is the rule invocation(s)
 * chain used to arrive at the state.  The semantic context is
 * the tree of semantic predicates encountered before reaching
 * an ATN state.
 */
class ATNConfig {
    /**
     * @param {...*} args
     */
    constructor(args) {
        /**
         * The ATN state associated with this configuration
         *
         * @type {ATNState}
         */
        this.state = null;
        /**
         * What alt (or lexer rule) is predicted by this configuration
         *
         * @type {number}
         */
        this.alt = 0;
        /**
         * The stack of invoking states leading to the rule/states associated
         * with this config.  We track only those contexts pushed during
         * execution of the ATN simulator.
         *
         * @type {org.antlr.v4.runtime.atn.PredictionContext}
         */
        this.context = null;
        /**
         * We cannot execute predicates dependent upon local context unless
         * we know for sure we are in the correct context. Because there is
         * no way to do this efficiently, we simply cannot evaluate
         * dependent predicates unless we are in the rule that initially
         * invokes the ATN simulator.
         *
         * <p>
         * closure() tracks the depth of how far we dip into the outer context:
         * depth &gt; 0.  Note that it may not be totally accurate depth since I
         * don't ever decrement. TODO: make it a boolean then</p>
         *
         * <p>
         * For memory efficiency, the {@link #isPrecedenceFilterSuppressed} method
         * is also backed by this field. Since the field is publicly accessible, the
         * highest bit which would not cause the value to become negative is used to
         * store this field. This choice minimizes the risk that code which only
         * compares this value to 0 would be affected by the new purpose of the
         * flag. It also ensures the performance of the existing {@link ATNConfig}
         * constructors as well as certain operations like
         * {@link ATNConfigSet#add(ATNConfig, DoubleKeyMap)} method are
         * <em>completely</em> unaffected by the change.</p>
         *
         * @type {number}
         */
        this.reachesIntoOuterContext = 0;
        /**
         * @type {org.antlr.v4.runtime.atn.SemanticContext}
         */
        this.semanticContext = null;

        var [a, b, c, d] = arguments;
        var l = arguments.length;
        if (a instanceof ATNConfig) {
            this.alt = a.alt;
            this.context = a.context;
            this.reachesIntoOuterContext = a.reachesIntoOuterContext;
            if (b instanceof ATNState) {
                this.state = b;
                if (c instanceof SemanticContext) {
                    this.semanticContext = c;
                } else {
                    this.context = c;
                    this.semanticContext = d || a.semanticContext;
                }
            } else {
                this.state = a.state;
                this.semanticContext = b || a.semanticContext;
            }
        } else {
            this.state = a;
            this.alt = b;
            this.context = c;
            this.semanticContext = d || SemanticContext.NONE;
        }
    }

	/**
	 * This method gets the value of the {@link #reachesIntoOuterContext} field
	 * as it existed prior to the introduction of the
	 * {@link #isPrecedenceFilterSuppressed} method.
     *
     * @return {number}
	 */
	getOuterContextDepth() {
		return this.reachesIntoOuterContext & ~ATNConfig.SUPPRESS_PRECEDENCE_FILTER;
	}

    /**
     * @return {boolean}
     */
	isPrecedenceFilterSuppressed() {
		return (this.reachesIntoOuterContext & ATNConfig.SUPPRESS_PRECEDENCE_FILTER) !== 0;
	}

    /**
     * @param {boolean} value
     * @return {void}
     */
	setPrecedenceFilterSuppressed(value) {
		if (value) {
			this.reachesIntoOuterContext |= 0x40000000;
		}
		else {
			this.reachesIntoOuterContext &= ~ATNConfig.SUPPRESS_PRECEDENCE_FILTER;
		}
	}

	/**
     * An ATN configuration is equal to another if both have
     * the same state, they predict the same alternative, and
     * syntactic/semantic contexts are the same.
     *
     * @param {Object} o
     * @return {boolean}
     */
    equals(o) {
		if (!(o instanceof ATNConfig)) {
			return false;
		}

		if (this === o) {
			return true;
		}
		else if (goog.isNull(o)) {
			return false;
		}

		return this.state.stateNumber === o.state.stateNumber
			&& this.alt === o.alt
			&& (this.context === o.context || (this.context != null && this.context.equals(o.context)))
			&& this.semanticContext.equals(o.semanticContext)
			&& this.isPrecedenceFilterSuppressed() === o.isPrecedenceFilterSuppressed();
	}

    /**
     * @return {number}
     */
	hashCode() {
		var hashCode = MurmurHash.initialize(7);
		hashCode = MurmurHash.update(hashCode, this.state.stateNumber);
		hashCode = MurmurHash.update(hashCode, this.alt);
		hashCode = MurmurHash.update(hashCode, this.context);
		hashCode = MurmurHash.update(hashCode, this.semanticContext);
		hashCode = MurmurHash.finish(hashCode, 4);
		return hashCode;
	}

    /**
     * @return {string}
     */
	toString() {
		return "(" + this.state + "," + this.alt +
            (this.context!==null ? ",[" + this.context.toString() + "]" : "") +
            (this.semanticContext !== SemanticContext.NONE ?
                ("," + this.semanticContext.toString())
                : "") +
            (this.reachesIntoOuterContext>0 ?
                (",up=" + this.reachesIntoOuterContext)
                : "") + ")";
    }
}

/**
 * This field stores the bit mask for implementing the
 * {@link #isPrecedenceFilterSuppressed} property as a bit within the
 * existing {@link #reachesIntoOuterContext} field.
 *
 * @type {number}
 */
ATNConfig.SUPPRESS_PRECEDENCE_FILTER = 0x40000000;


exports = ATNConfig;
