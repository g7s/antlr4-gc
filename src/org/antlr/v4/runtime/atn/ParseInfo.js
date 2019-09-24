/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.ParseInfo');
goog.module.declareLegacyNamespace();


/**
 * This class provides access to specific and aggregate statistics gathered
 * during profiling of a parser.
 *
 * @since 4.3
 */
class ParseInfo {
    /**
     * @param {org.antlr.v4.runtime.atn.ProfilingATNSimulator} atnSimulator
     */
	constructor(atnSimulator) {
        /**
         * @protected {org.antlr.v4.runtime.atn.ProfilingATNSimulator}
         */
		this.atnSimulator = atnSimulator;
	}

	/**
	 * Gets an array of {@link DecisionInfo} instances containing the profiling
	 * information gathered for each decision in the ATN.
	 *
	 * @return {Array<org.antlr.v4.runtime.atn.DecisionInfo>} An array of {@link DecisionInfo} instances, indexed by decision
	 * number.
	 */
	getDecisionInfo() {
		return this.atnSimulator.getDecisionInfo();
	}

	/**
	 * Gets the decision numbers for decisions that required one or more
	 * full-context predictions during parsing. These are decisions for which
	 * {@link DecisionInfo#LL_Fallback} is non-zero.
	 *
	 * @return {Array<number>} A list of decision numbers which required one or more
	 * full-context predictions during parsing.
	 */
	getLLDecisions() {
        var decisions = this.getDecisionInfo();
        /**
         * @type {Array<number>}
         */
        var LL = [];
        decisions.forEach((d, i) => {
            if (d.LL_Fallback > 0) LL.push(i);
        });
		return LL;
	}

	/**
	 * Gets the total time spent during prediction across all decisions made
	 * during parsing. This value is the sum of
	 * {@link DecisionInfo#timeInPrediction} for all decisions.
     *
     * @return {number}
	 */
	getTotalTimeInPrediction() {
		var decisions = this.getDecisionInfo();
        var t = 0;
        decisions.forEach(d => t += d.timeInPrediction);
		return t;
	}

	/**
	 * Gets the total number of SLL lookahead operations across all decisions
	 * made during parsing. This value is the sum of
	 * {@link DecisionInfo#SLL_TotalLook} for all decisions.
     *
     * @return {number}
	 */
	getTotalSLLLookaheadOps() {
		var decisions = this.getDecisionInfo();
        var k = 0;
        decisions.forEach(d => k += d.SLL_TotalLook);
		return k;
	}

	/**
	 * Gets the total number of LL lookahead operations across all decisions
	 * made during parsing. This value is the sum of
	 * {@link DecisionInfo#LL_TotalLook} for all decisions.
     *
     * @return {number}
	 */
	getTotalLLLookaheadOps() {
		var decisions = this.getDecisionInfo();
		var k = 0;
		decisions.forEach(d => k += d.LL_TotalLook);
        return k;
	}

	/**
	 * Gets the total number of ATN lookahead operations for SLL prediction
	 * across all decisions made during parsing.
     *
     * @return {number}
	 */
	getTotalSLLATNLookaheadOps() {
        var decisions = this.getDecisionInfo();
        var k = 0;
        decisions.forEach(d => k += d.SLL_ATNTransitions);
        return k;
	}

	/**
	 * Gets the total number of ATN lookahead operations for LL prediction
	 * across all decisions made during parsing.
     *
     * @return {number}
	 */
	getTotalLLATNLookaheadOps() {
        var decisions = this.getDecisionInfo();
        var k = 0;
        decisions.forEach(d => k += d.LL_ATNTransitions);
        return k;
	}

	/**
	 * Gets the total number of ATN lookahead operations for SLL and LL
	 * prediction across all decisions made during parsing.
	 *
	 * <p>
	 * This value is the sum of {@link #getTotalSLLATNLookaheadOps} and
	 * {@link #getTotalLLATNLookaheadOps}.</p>
     *
     * @return {number}
	 */
	getTotalATNLookaheadOps() {
        var decisions = this.getDecisionInfo();
        var k = 0;
        decisions.forEach(d => {
            k += d.SLL_ATNTransitions;
            k += d.LL_ATNTransitions;
        });
        return k;
	}

	/**
	 * Gets the total number of DFA states stored in the DFA cache for all
	 * decisions in the ATN. If decision is passed then gets the total number
     * of DFA states stored in the DFA cache for a particular decision.
     *
     * @param {number=} decision
     * @return {number}
	 */
	getDFASize(decision) {
        if (decision) return this.atnSimulator.decisionToDFA[decision].states.size();
		var n = 0;
		for (var i = 0; i < this.atnSimulator.decisionToDFA.length; i++) {
			n += this.getDFASize(i);
		}
		return n;
	}
}


exports = ParseInfo;
