/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.PredicateEvalInfo');


const DecisionEventInfo = goog.require('org.antlr.v4.runtime.atn.DecisionEventInfo');
const ATNConfigSet = goog.require('org.antlr.v4.runtime.atn.ATNConfigSet');
const ParserRuleContext = goog.require('org.antlr.v4.runtime.ParserRuleContext');
const Recognizer = goog.require('org.antlr.v4.runtime.Recognizer');
const RuleContext = goog.require('org.antlr.v4.runtime.RuleContext');

/**
 * This class represents profiling event information for semantic predicate
 * evaluations which occur during prediction.
 *
 * @see ParserATNSimulator#evalSemanticContext
 *
 * @since 4.3
 */
class PredicateEvalInfo extends DecisionEventInfo {
	/**
	 * Constructs a new instance of the {@link PredicateEvalInfo} class with the
	 * specified detailed predicate evaluation information.
	 *
	 * @param {number} decision The decision number
	 * @param {org.antlr.v4.runtime.TokenStream} input The input token stream
	 * @param {number} startIndex The start index for the current prediction
	 * @param {number} stopIndex The index at which the predicate evaluation was
	 * triggered. Note that the input stream may be reset to other positions for
	 * the actual evaluation of individual predicates.
	 * @param {org.antlr.v4.runtime.atn.SemanticContext} semctx The semantic context which was evaluated
	 * @param {boolean} evalResult The results of evaluating the semantic context
	 * @param {number} predictedAlt The alternative number for the decision which is
	 * guarded by the semantic context {@code semctx}. See {@link #predictedAlt}
	 * for more information.
	 * @param {boolean} fullCtx {@code true} if the semantic context was
	 * evaluated during LL prediction; otherwise, {@code false} if the semantic
	 * context was evaluated during SLL prediction
	 *
	 * @see ParserATNSimulator#evalSemanticContext(SemanticContext, ParserRuleContext, int, boolean)
	 * @see SemanticContext#eval(Recognizer, RuleContext)
	 */
	constructor(decision, input, startIndex, stopIndex, semctx, evalResult, predictedAlt, fullCtx) {
        super(decision, new ATNConfigSet(), input, startIndex, stopIndex, fullCtx);
        /**
         * The semantic context which was evaluated.
         *
         * @type {org.antlr.v4.runtime.atn.SemanticContext}
         */
        this.semctx = semctx;
        /**
         * The result of evaluating the semantic context {@link #semctx}.
         *
         * @type {boolean}
         */
        this.evalResult = evalResult;
        /**
         * The alternative number for the decision which is guarded by the semantic
         * context {@link #semctx}. Note that other ATN
         * configurations may predict the same alternative which are guarded by
         * other semantic contexts and/or {@link SemanticContext#NONE}.
         *
         * @type {number}
         */
		this.predictedAlt = predictedAlt;
	}
}


exports = PredicateEvalInfo;
