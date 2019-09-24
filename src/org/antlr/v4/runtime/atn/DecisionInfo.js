/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.DecisionInfo');
goog.module.declareLegacyNamespace();


/**
 * This class contains profiling gathered for a particular decision.
 *
 * <p>
 * Parsing performance in ANTLR 4 is heavily influenced by both static factors
 * (e.g. the form of the rules in the grammar) and dynamic factors (e.g. the
 * choice of input and the state of the DFA cache at the time profiling
 * operations are started). For best results, gather and use aggregate
 * statistics from a large sample of inputs representing the inputs expected in
 * production before using the results to make changes in the grammar.</p>
 *
 * @since 4.3
 */
class DecisionInfo {
	/**
	 * Constructs a new instance of the {@link DecisionInfo} class to contain
	 * statistics for a particular decision.
	 *
	 * @param {number} decision The decision number
	 */
	constructor(decision) {
        /**
         * The decision number, which is an index into {@link ATN#decisionToState}.
         *
         * @type {number}
         */
        this.decision = decision;

        /**
         * The total number of times {@link ParserATNSimulator#adaptivePredict} was
         * invoked for this decision.
         *
         * @type {number}
         */
        this.invocations = 0;

        /**
         * The total time spent in {@link ParserATNSimulator#adaptivePredict} for
         * this decision, in nanoseconds.
         *
         * <p>
         * The value of this field contains the sum of differential results obtained
         * by {@link System#nanoTime()}, and is not adjusted to compensate for JIT
         * and/or garbage collection overhead. For best accuracy, use a modern JVM
         * implementation that provides precise results from
         * {@link System#nanoTime()}, and perform profiling in a separate process
         * which is warmed up by parsing the input prior to profiling. If desired,
         * call {@link ATNSimulator#clearDFA} to reset the DFA cache to its initial
         * state before starting the profiling measurement pass.</p>
         *
         * @type {number}
         */
        this.timeInPrediction = 0;

        /**
         * The sum of the lookahead required for SLL prediction for this decision.
         * Note that SLL prediction is used before LL prediction for performance
         * reasons even when {@link PredictionMode#LL} or
         * {@link PredictionMode#LL_EXACT_AMBIG_DETECTION} is used.
         *
         * @type {number}
         */
        this.SLL_TotalLook = 0;

        /**
         * Gets the minimum lookahead required for any single SLL prediction to
         * complete for this decision, by reaching a unique prediction, reaching an
         * SLL conflict state, or encountering a syntax error.
         *
         * @type {number}
         */
        this.SLL_MinLook = 0;

        /**
         * Gets the maximum lookahead required for any single SLL prediction to
         * complete for this decision, by reaching a unique prediction, reaching an
         * SLL conflict state, or encountering a syntax error.
         *
         * @type {number}
         */
        this.SLL_MaxLook = 0;

        /**
         * Gets the {@link LookaheadEventInfo} associated with the event where the
         * {@link #SLL_MaxLook} value was set.
         *
         * @type {org.antlr.v4.runtime.atn.LookaheadEventInfo}
         */
        this.SLL_MaxLookEvent = null;

        /**
         * The sum of the lookahead required for LL prediction for this decision.
         * Note that LL prediction is only used when SLL prediction reaches a
         * conflict state.
         *
         * @type {number}
         */
        this.LL_TotalLook = 0;

        /**
         * Gets the minimum lookahead required for any single LL prediction to
         * complete for this decision. An LL prediction completes when the algorithm
         * reaches a unique prediction, a conflict state (for
         * {@link PredictionMode#LL}, an ambiguity state (for
         * {@link PredictionMode#LL_EXACT_AMBIG_DETECTION}, or a syntax error.
         *
         * @type {number}
         */
        this.LL_MinLook = 0;

        /**
         * Gets the maximum lookahead required for any single LL prediction to
         * complete for this decision. An LL prediction completes when the algorithm
         * reaches a unique prediction, a conflict state (for
         * {@link PredictionMode#LL}, an ambiguity state (for
         * {@link PredictionMode#LL_EXACT_AMBIG_DETECTION}, or a syntax error.
         *
         * @type {number}
         */
        this.LL_MaxLook = 0;

        /**
         * Gets the {@link LookaheadEventInfo} associated with the event where the
         * {@link #LL_MaxLook} value was set.
         *
         * @type {org.antlr.v4.runtime.atn.LookaheadEventInfo}
         */
        this.LL_MaxLookEvent = null;

        /**
         * A collection of {@link ContextSensitivityInfo} instances describing the
         * context sensitivities encountered during LL prediction for this decision.
         *
         * @see ContextSensitivityInfo
         *
         * @type {Array<org.antlr.v4.runtime.atn.ContextSensitivityInfo>}
         */
        this.contextSensitivities = [];

        /**
         * A collection of {@link ErrorInfo} instances describing the parse errors
         * identified during calls to {@link ParserATNSimulator#adaptivePredict} for
         * this decision.
         *
         * @see ErrorInfo
         *
         * @type {Array<org.antlr.v4.runtime.atn.ErrorInfo>}
         */
        this.errors = [];

        /**
         * A collection of {@link AmbiguityInfo} instances describing the
         * ambiguities encountered during LL prediction for this decision.
         *
         * @see AmbiguityInfo
         *
         * @type {Array<org.antlr.v4.runtime.atn.AmbiguityInfo>}
         */
        this.ambiguities = [];

        /**
         * A collection of {@link PredicateEvalInfo} instances describing the
         * results of evaluating individual predicates during prediction for this
         * decision.
         *
         * @see PredicateEvalInfo
         *
         * @type {Array<org.antlr.v4.runtime.atn.PredicateEvalInfo>}
         */
        this.predicateEvals = [];

        /**
         * The total number of ATN transitions required during SLL prediction for
         * this decision. An ATN transition is determined by the number of times the
         * DFA does not contain an edge that is required for prediction, resulting
         * in on-the-fly computation of that edge.
         *
         * <p>
         * If DFA caching of SLL transitions is employed by the implementation, ATN
         * computation may cache the computed edge for efficient lookup during
         * future parsing of this decision. Otherwise, the SLL parsing algorithm
         * will use ATN transitions exclusively.</p>
         *
         * @see #SLL_ATNTransitions
         * @see ParserATNSimulator#computeTargetState
         * @see LexerATNSimulator#computeTargetState
         *
         * @type {number}
         */
        this.SLL_ATNTransitions = 0;

        /**
         * The total number of DFA transitions required during SLL prediction for
         * this decision.
         *
         * <p>If the ATN simulator implementation does not use DFA caching for SLL
         * transitions, this value will be 0.</p>
         *
         * @see ParserATNSimulator#getExistingTargetState
         * @see LexerATNSimulator#getExistingTargetState
         *
         * @type {number}
         */
        this.SLL_DFATransitions = 0;

        /**
         * Gets the total number of times SLL prediction completed in a conflict
         * state, resulting in fallback to LL prediction.
         *
         * <p>Note that this value is not related to whether or not
         * {@link PredictionMode#SLL} may be used successfully with a particular
         * grammar. If the ambiguity resolution algorithm applied to the SLL
         * conflicts for this decision produce the same result as LL prediction for
         * this decision, {@link PredictionMode#SLL} would produce the same overall
         * parsing result as {@link PredictionMode#LL}.</p>
         *
         * @type {number}
         */
        this.LL_Fallback = 0;

        /**
         * The total number of ATN transitions required during LL prediction for
         * this decision. An ATN transition is determined by the number of times the
         * DFA does not contain an edge that is required for prediction, resulting
         * in on-the-fly computation of that edge.
         *
         * <p>
         * If DFA caching of LL transitions is employed by the implementation, ATN
         * computation may cache the computed edge for efficient lookup during
         * future parsing of this decision. Otherwise, the LL parsing algorithm will
         * use ATN transitions exclusively.</p>
         *
         * @see #LL_DFATransitions
         * @see ParserATNSimulator#computeTargetState
         * @see LexerATNSimulator#computeTargetState
         *
         * @type {number}
         */
        this.LL_ATNTransitions = 0;

        /**
         * The total number of DFA transitions required during LL prediction for
         * this decision.
         *
         * <p>If the ATN simulator implementation does not use DFA caching for LL
         * transitions, this value will be 0.</p>
         *
         * @see ParserATNSimulator#getExistingTargetState
         * @see LexerATNSimulator#getExistingTargetState
         *
         * @type {number}
         */
        this.LL_DFATransitions = 0;
	}

    /**
     * @return {string}
     */
	toString() {
		return "{" +
			   "decision=" + this.decision +
			   ", contextSensitivities=" + this.contextSensitivities.length +
			   ", errors=" + this.errors.length +
			   ", ambiguities=" + this.ambiguities.length +
			   ", SLL_lookahead=" + this.SLL_TotalLook +
			   ", SLL_ATNTransitions=" + this.SLL_ATNTransitions +
			   ", SLL_DFATransitions=" + this.SLL_DFATransitions +
			   ", LL_Fallback=" + this.LL_Fallback +
			   ", LL_lookahead=" + this.LL_TotalLook +
			   ", LL_ATNTransitions=" + this.LL_ATNTransitions +
			   '}';
	}
}


exports = DecisionInfo;
