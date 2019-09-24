/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.AmbiguityInfo');
goog.module.declareLegacyNamespace();


const DecisionEventInfo = goog.require('org.antlr.v4.runtime.atn.DecisionEventInfo');

/**
 * This class represents profiling event information for an ambiguity.
 * Ambiguities are decisions where a particular input resulted in an SLL
 * conflict, followed by LL prediction also reaching a conflict state
 * (indicating a true ambiguity in the grammar).
 *
 * <p>
 * This event may be reported during SLL prediction in cases where the
 * conflicting SLL configuration set provides sufficient information to
 * determine that the SLL conflict is truly an ambiguity. For example, if none
 * of the ATN configurations in the conflicting SLL configuration set have
 * traversed a global follow transition (i.e.
 * {@link ATNConfig#reachesIntoOuterContext} is 0 for all configurations), then
 * the result of SLL prediction for that input is known to be equivalent to the
 * result of LL prediction for that input.</p>
 *
 * <p>
 * In some cases, the minimum represented alternative in the conflicting LL
 * configuration set is not equal to the minimum represented alternative in the
 * conflicting SLL configuration set. Grammars and inputs which result in this
 * scenario are unable to use {@link PredictionMode#SLL}, which in turn means
 * they cannot use the two-stage parsing strategy to improve parsing performance
 * for that input.</p>
 *
 * @see ParserATNSimulator#reportAmbiguity
 * @see ANTLRErrorListener#reportAmbiguity
 *
 * @since 4.3
 */
class AmbiguityInfo extends DecisionEventInfo {
	/**
	 * Constructs a new instance of the {@link AmbiguityInfo} class with the
	 * specified detailed ambiguity information.
	 *
	 * @param {number} decision The decision number
	 * @param {org.antlr.v4.runtime.atn.ATNConfigSet} configs The final
     * configuration set identifying the ambiguous alternatives for the current input
	 * @param {org.antlr.v4.runtime.misc.BitSet} ambigAlts The set of
     * alternatives in the decision that lead to a valid parse. The predicted
     * alt is the min(ambigAlts)
	 * @param {org.antlr.v4.runtime.TokenStream} input The input token stream
	 * @param {number} startIndex The start index for the current prediction
	 * @param {number} stopIndex The index at which the ambiguity was identified during
	 * prediction
	 * @param {boolean} fullCtx {@code true} if the ambiguity was identified during LL
	 * prediction; otherwise, {@code false} if the ambiguity was identified
	 * during SLL prediction
	 */
	constructor(decision, configs, ambigAlts, input, startIndex, stopIndex, fullCtx) {
        super(decision, configs, input, startIndex, stopIndex, fullCtx);
        /**
         * The set of alternative numbers for this decision event that lead to a valid parse.
         *
         * @type {org.antlr.v4.runtime.misc.BitSet}
         *
         */
		this.ambigAlts = ambigAlts;
	}
}


exports = AmbiguityInfo;
