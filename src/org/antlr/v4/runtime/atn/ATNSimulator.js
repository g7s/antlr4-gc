/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.ATNSimulator');


const DFAState = goog.require('org.antlr.v4.runtime.dfa.DFAState');
const PredictionContext = goog.require('org.antlr.v4.runtime.atn.PredictionContext');
const ATNConfigSet = goog.require('org.antlr.v4.runtime.atn.ATNConfigSet');
const Map = goog.require('org.antlr.v4.runtime.misc.Map');

/**
 * @abstract
 */
class ATNSimulator {
    /**
     * @param {org.antlr.v4.runtime.atn.ATN} atn
     * @param {org.antlr.v4.runtime.atn.PredictionContextCache} sharedContextCache
     */
	constructor(atn, sharedContextCache) {
        /**
         * @type {org.antlr.v4.runtime.atn.ATN}
         */
        this.atn = atn;
        /**
         * The context cache maps all PredictionContext objects that are equals()
         * to a single cached copy. This cache is shared across all contexts
         * in all ATNConfigs in all DFA states.  We rebuild each ATNConfigSet
         * to use only cached nodes/graphs in addDFAState(). We don't want to
         * fill this during closure() since there are lots of contexts that
         * pop up but are not used ever again. It also greatly slows down closure().
         *
         * <p>This cache makes a huge difference in memory and a little bit in speed.
         * For the Java grammar on java.*, it dropped the memory requirements
         * at the end from 25M to 16M. We don't store any of the full context
         * graphs in the DFA because they are limited to local context only,
         * but apparently there's a lot of repetition there as well. We optimize
         * the config contexts before storing the config set in the DFA states
         * by literally rebuilding them with cached subgraphs only.</p>
         *
         * <p>I tried a cache for use during closure operations, that was
         * whacked after each adaptivePredict(). It cost a little bit
         * more time I think and doesn't save on the overall footprint
         * so it's not worth the complexity.</p>
         *
         * @protected {org.antlr.v4.runtime.atn.PredictionContextCache}
         */
        this.sharedContextCache = sharedContextCache;
	}

    /**
     * @abstract
     * @return {void}
     */
    reset() {}

	/**
	 * Clear the DFA cache used by the current instance. Since the DFA cache may
	 * be shared by multiple ATN simulators, this method may affect the
	 * performance (but not accuracy) of other parsers which are being used
	 * concurrently.
	 *
	 * @throws {Error} UnsupportedOperationException if the current instance does not
	 * support clearing the DFA.
	 *
	 * @since 4.3
     *
     * @return {void}
	 */
	clearDFA() {
		throw new Error("This ATN simulator does not support clearing the DFA.");
	}

    /**
     * @return {org.antlr.v4.runtime.atn.PredictionContextCache}
     */
	getSharedContextCache() {
		return this.sharedContextCache;
	}

    /**
     * @param {org.antlr.v4.runtime.atn.PredictionContext} context
     * @return {org.antlr.v4.runtime.atn.PredictionContext}
     */
	getCachedContext(context) {
        if (this.sharedContextCache == null) return context;

        /**
         * @type {Map<PredictionContext, PredictionContext>}
         */
        var visited = new Map();
        return PredictionContext.getCachedContext(context, sharedContextCache, visited);
	}
}


/**
 * Must distinguish between missing edge and edge we know leads nowhere
 *
 * @type {DFAState}
 */

ATNSimulator.ERROR = new DFAState(new ATNConfigSet());
ATNSimulator.ERROR.stateNumber = Number.MAX_VALUE;


exports = ATNSimulator;
