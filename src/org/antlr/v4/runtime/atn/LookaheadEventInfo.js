/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LookaheadEventInfo');
goog.module.declareLegacyNamespace();


const DecisionEventInfo = goog.require('org.antlr.v4.runtime.atn.DecisionEventInfo');

/**
 * This class represents profiling event information for tracking the lookahead
 * depth required in order to make a prediction.
 *
 * @since 4.3
 */
class LookaheadEventInfo extends DecisionEventInfo {
	/**
	 * Constructs a new instance of the {@link LookaheadEventInfo} class with
	 * the specified detailed lookahead information.
	 *
	 * @param {number} decision The decision number
	 * @param {org.antlr.v4.runtime.atn.ATNConfigSet} configs The final
     * configuration set containing the necessary information to determine
     * the result of a prediction, or {@code null} if the final configuration
     * set is not available
     * @param {number} predictedAlt
	 * @param {org.antlr.v4.runtime.TokenStream} input The input token stream
	 * @param {number} startIndex The start index for the current prediction
	 * @param {number} stopIndex The index at which the prediction was finally made
	 * @param {boolean} fullCtx {@code true} if the current lookahead is part of an LL
	 * prediction; otherwise, {@code false} if the current lookahead is part of
	 * an SLL prediction
	 */
	constructor(decision, configs, predictedAlt, input, startIndex, stopIndex, fullCtx) {
        super(decision, configs, input, startIndex, stopIndex, fullCtx);
        /**
         * The alternative chosen by adaptivePredict(), not necessarily
         * the outermost alt shown for a rule; left-recursive rules have
         * user-level alts that differ from the rewritten rule with a (...) block
         * and a (..)* loop.
         *
         * @type {number}
         */
		this.predictedAlt = predictedAlt;
	}
}


exports = LookaheadEventInfo;
