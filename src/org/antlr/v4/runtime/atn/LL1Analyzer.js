/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LL1Analyzer');
goog.module.declareLegacyNamespace();


const ATNConfig = goog.require('org.antlr.v4.runtime.atn.ATNConfig');
const PredictionContext = goog.require('org.antlr.v4.runtime.atn.PredictionContext');
const SingletonPredictionContext = goog.require('org.antlr.v4.runtime.atn.SingletonPredictionContext');
const RuleStopState = goog.require('org.antlr.v4.runtime.atn.RuleStopState');
const AbstractPredicateTransition = goog.require('org.antlr.v4.runtime.atn.AbstractPredicateTransition');
const RuleTransition = goog.require('org.antlr.v4.runtime.atn.RuleTransition');
const WildcardTransition = goog.require('org.antlr.v4.runtime.atn.WildcardTransition');
const NotSetTransition = goog.require('org.antlr.v4.runtime.atn.NotSetTransition');
const Token = goog.require('org.antlr.v4.runtime.Token');
const IntervalSet = goog.require('org.antlr.v4.runtime.misc.IntervalSet');
const BitSet = goog.require('org.antlr.v4.runtime.misc.BitSet');
const Set = goog.require('org.antlr.v4.runtime.misc.Set');

class LL1Analyzer {
    /**
     * @param {org.antlr.v4.runtime.atn.ATN} atn
     */
	constructor(atn) {
        /**
         * @type {org.antlr.v4.runtime.atn.ATN}
         */
        this.atn = atn;
    }

	/**
	 * Calculates the SLL(1) expected lookahead set for each outgoing transition
	 * of an {@link ATNState}. The returned array has one element for each
	 * outgoing transition in {@code s}. If the closure from transition
	 * <em>i</em> leads to a semantic predicate before matching a symbol, the
	 * element at index <em>i</em> of the result will be {@code null}.
	 *
	 * @param {org.antlr.v4.runtime.atn.ATNState} s the ATN state
	 * @return {Array<IntervalSet>} the expected symbols for each outgoing transition of {@code s}.
	 */
    getDecisionLookahead(s) {
		if (s == null) {
			return null;
		}

        /**
         * @type {Array<IntervalSet>}
         */
		var look = [];
		for (var alt = 0; alt < s.getNumberOfTransitions(); alt++) {
            look[alt] = new IntervalSet();
            /**
             * @type {Set<ATNConfig>}
             */
			var lookBusy = new Set();
			var seeThruPreds = false; // fail to get lookahead upon pred
			this._LOOK(s.transition(alt).target, null, PredictionContext.EMPTY,
				  look[alt], lookBusy, new BitSet(), seeThruPreds, false);
			// Wipe out lookahead for this alternative if we found nothing
			// or we had a predicate when we !seeThruPreds
			if (look[alt].size() === 0 || look[alt].contains(LL1Analyzer.HIT_PRED)) {
				look[alt] = null;
			}
		}
		return look;
	}

	/**
	 * Compute set of tokens that can follow {@code s} in the ATN in the
	 * specified {@code ctx}.
	 *
	 * <p>If {@code ctx} is {@code null} and the end of the rule containing
	 * {@code s} is reached, {@link Token#EPSILON} is added to the result set.
	 * If {@code ctx} is not {@code null} and the end of the outermost rule is
	 * reached, {@link Token#EOF} is added to the result set.</p>
	 *
	 * @param {org.antlr.v4.runtime.atn.ATNState} s the ATN state
	 * @param {org.antlr.v4.runtime.RuleContext} ctx the complete parser
	 * context, or {@code null} if the context should be ignored
	 *
	 * @return {IntervalSet} The set of tokens that can follow {@code s} in the ATN in the
	 * specified {@code ctx}.
	 */
	LOOKC(s, ctx) {
		return this.LOOK(s, null, ctx);
   	}

	/**
	 * Compute set of tokens that can follow {@code s} in the ATN in the
	 * specified {@code ctx}.
	 *
	 * <p>If {@code ctx} is {@code null} and the end of the rule containing
	 * {@code s} is reached, {@link Token#EPSILON} is added to the result set.
	 * If {@code ctx} is not {@code null} and the end of the outermost rule is
	 * reached, {@link Token#EOF} is added to the result set.</p>
	 *
	 * @param {org.antlr.v4.runtime.atn.ATNState} s the ATN state
	 * @param {org.antlr.v4.runtime.atn.ATNState} stopState
     * the ATN state to stop at. This can be a {@link BlockEndState} to detect
     * epsilon paths through a closure.
	 * @param {org.antlr.v4.runtime.RuleContext} ctx the complete parser context,
     * or {@code null} if the context should be ignored
	 *
	 * @return {IntervalSet} The set of tokens that can follow {@code s} in the ATN in the
	 * specified {@code ctx}.
	 */

   	LOOK(s, stopState, ctx) {
   		var r = new IntervalSet();
		var seeThruPreds = true; // ignore preds; get all lookahead
		var lookContext = ctx != null ? PredictionContext.fromRuleContext(s.atn, ctx) : null;
   		this._LOOK(s, stopState, lookContext, r, new Set(), new BitSet(), seeThruPreds, true);
   		return r;
   	}

	/**
	 * Compute set of tokens that can follow {@code s} in the ATN in the
	 * specified {@code ctx}.
	 *
	 * <p>If {@code ctx} is {@code null} and {@code stopState} or the end of the
	 * rule containing {@code s} is reached, {@link Token#EPSILON} is added to
	 * the result set. If {@code ctx} is not {@code null} and {@code addEOF} is
	 * {@code true} and {@code stopState} or the end of the outermost rule is
	 * reached, {@link Token#EOF} is added to the result set.</p>
	 *
     * @protected
	 * @param {org.antlr.v4.runtime.atn.ATNState} s the ATN state.
	 * @param {org.antlr.v4.runtime.atn.ATNState} stopState the ATN state to stop at. This can be a
	 * {@link BlockEndState} to detect epsilon paths through a closure.
	 * @param {org.antlr.v4.runtime.atn.PredictionContext} ctx The outer context, or null
     * if the outer context should not be used.
	 * @param {IntervalSet} look The result lookahead set.
	 * @param {Set<ATNConfig>} lookBusy A set used for preventing epsilon closures in the ATN
	 * from causing a stack overflow. Outside code should pass
	 * {@code new HashSet<ATNConfig>} for this argument.
	 * @param {BitSet} calledRuleStack A set used for preventing left recursion in the
	 * ATN from causing a stack overflow. Outside code should pass
	 * {@code new BitSet()} for this argument.
	 * @param {boolean} seeThruPreds {@code true} to true semantic predicates as
	 * implicitly {@code true} and "see through them", otherwise {@code false}
	 * to treat semantic predicates as opaque and add {@link #HIT_PRED} to the
	 * result if one is encountered.
	 * @param {boolean} addEOF Add {@link Token#EOF} to the result if the end of the
	 * outermost context is reached. This parameter has no effect if {@code ctx}
	 * is {@code null}.
     * @return {void}
	 */
    _LOOK(s, stopState, ctx, look, lookBusy, calledRuleStack, seeThruPreds, addEOF) {
//		System.out.println("_LOOK("+s.stateNumber+", ctx="+ctx);
        var c = new ATNConfig(s, 0, ctx);
        if (!lookBusy.add(c)) return;

		if (s === stopState) {
			if (ctx == null) {
				look.add(Token.EPSILON);
				return;
			}
			else if (ctx.isEmpty() && addEOF) {
				look.add(Token.EOF);
				return;
			}
		}

        if (s instanceof RuleStopState) {
            if (ctx == null) {
                look.add(Token.EPSILON);
                return;
            }
            else if (ctx.isEmpty() && addEOF) {
				look.add(Token.EOF);
				return;
			}

			if (ctx !== PredictionContext.EMPTY) {
				// run thru all possible stack tops in ctx
				var removed = calledRuleStack.get(s.ruleIndex);
				try {
					calledRuleStack.clear(s.ruleIndex);
					for (var i = 0; i < ctx.size(); i++) {
						var returnState = this.atn.states[ctx.getReturnState(i)];
//					    System.out.println("popping back to "+retState);
						this._LOOK(returnState, stopState, ctx.getParent(i), look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
					}
				}
				finally {
					if (removed) {
						calledRuleStack.set(s.ruleIndex);
					}
				}
				return;
			}
        }

        var n = s.getNumberOfTransitions();
        for (var i = 0; i < n; i++) {
			var t = s.transition(i);
			if (t.constructor.name === RuleTransition.name) {
				var rt = /** @type {RuleTransition} */ (t);
				if (calledRuleStack.get(rt.target.ruleIndex)) {
					continue;
				}
				var newContext = SingletonPredictionContext.create(ctx, rt.followState.stateNumber);

				try {
					calledRuleStack.set(rt.target.ruleIndex);
                    this._LOOK(rt.target, stopState, newContext, look, lookBusy,
                        calledRuleStack, seeThruPreds, addEOF);
				}
				finally {
					calledRuleStack.clear(rt.target.ruleIndex);
				}
			}
			else if (t instanceof AbstractPredicateTransition) {
				if (seeThruPreds) {
                    this._LOOK(t.target, stopState, ctx, look, lookBusy,
                        calledRuleStack, seeThruPreds, addEOF);
				}
				else {
					look.add(LL1Analyzer.HIT_PRED);
				}
			}
			else if (t.isEpsilon()) {
                this._LOOK(t.target, stopState, ctx, look, lookBusy,
                    calledRuleStack, seeThruPreds, addEOF);
			}
			else if (t.constructor.name === WildcardTransition.name) {
				look.addAll(IntervalSet.of(Token.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType));
			}
			else {
				var set = t.label();
				if (set != null) {
					if (t instanceof NotSetTransition) {
						set = set.complement(IntervalSet.of(Token.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType));
					}
					look.addAll(set);
				}
			}
		}
    }
}


/**
 * Special value added to the lookahead sets to indicate that we hit
 * a predicate during analysis if {@code seeThruPreds==false}.
 *
 * @type {number}
 */
LL1Analyzer.HIT_PRED = Token.INVALID_TYPE;


exports = LL1Analyzer;
