/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.ProfilingATNSimulator');


const ATNSimulator = goog.require('org.antlr.v4.runtime.atn.ATNSimulator');
const DecisionInfo = goog.require('org.antlr.v4.runtime.atn.DecisionInfo');
const PredicateEvalInfo = goog.require('org.antlr.v4.runtime.atn.PredicateEvalInfo');
const ContextSensitivityInfo = goog.require('org.antlr.v4.runtime.atn.ContextSensitivityInfo');
const AmbiguityInfo = goog.require('org.antlr.v4.runtime.atn.AmbiguityInfo');
const SemanticContext = goog.require('org.antlr.v4.runtime.atn.SemanticContext');
const ErrorInfo = goog.require('org.antlr.v4.runtime.atn.ErrorInfo');
const LookaheadEventInfo = goog.require('org.antlr.v4.runtime.atn.LookaheadEventInfo');
const ParserATNSimulator = goog.require('org.antlr.v4.runtime.atn.ParserATNSimulator');

/**
 * @since 4.3
 */
class ProfilingATNSimulator extends ParserATNSimulator {
    /**
     * @param {org.antlr.v4.runtime.Parser} parser
     */
	constructor(parser) {
        var interp = parser.getInterpreter();
        super(parser, interp.atn, interp.decisionToDFA, interp.sharedContextCache);
        /**
         * @protected {number}
         */
        this.numDecisions = this.atn.decisionToState.size();
        /**
         * @protected {Array<DecisionInfo>}
         */
		this.decisions = [];
		for (var i = 0; i < this.numDecisions; i++) {
			this.decisions[i] = new DecisionInfo(i);
        }
        /**
         * @protected {number}
         */
        this._sllStopIndex = 0;
        /**
         * @protected {number}
         */
        this._llStopIndex = 0;
        /**
         * @protected {number}
         */
        this.currentDecision = 0;
        /**
         * @protected {org.antlr.v4.runtime.dfa.DFAState}
         */
        this.currentState = null;
        /** At the point of LL failover, we record how SLL would resolve the conflict so that
         *  we can determine whether or not a decision / input pair is context-sensitive.
         *  If LL gives a different result than SLL's predicted alternative, we have a
         *  context sensitivity for sure. The converse is not necessarily true, however.
         *  It's possible that after conflict resolution chooses minimum alternatives,
         *  SLL could get the same answer as LL. Regardless of whether or not the result indicates
         *  an ambiguity, it is not treated as a context sensitivity because LL prediction
         *  was not required in order to produce a correct prediction for this decision and input sequence.
         *  It may in fact still be a context sensitivity but we don't know by looking at the
         *  minimum alternatives for the current input.
         *
         * @protected {number}
         */
        this.conflictingAltResolvedBySLL = 0;
	}

	adaptivePredict(input, decision, outerContext) {
		try {
			this._sllStopIndex = -1;
			this._llStopIndex = -1;
			this.currentDecision = decision;
			var start = window.performance.now(); // expensive but useful info
			var alt = super.adaptivePredict(input, decision, outerContext);
			var stop = window.performance.now();
			this.decisions[decision].timeInPrediction += (stop - start);
			this.decisions[decision].invocations++;

			var SLL_k = this._sllStopIndex - this._startIndex + 1;
			this.decisions[decision].SLL_TotalLook += SLL_k;
			this.decisions[decision].SLL_MinLook = this.decisions[decision].SLL_MinLook == 0 ? SLL_k : Math.min(this.decisions[decision].SLL_MinLook, SLL_k);
			if (SLL_k > this.decisions[decision].SLL_MaxLook) {
				this.decisions[decision].SLL_MaxLook = SLL_k;
				this.decisions[decision].SLL_MaxLookEvent =
						new LookaheadEventInfo(decision, null, alt, input, this._startIndex, this._sllStopIndex, false);
			}

			if (this._llStopIndex >= 0) {
				var LL_k = this._llStopIndex - this._startIndex + 1;
				this.decisions[decision].LL_TotalLook += LL_k;
				this.decisions[decision].LL_MinLook = this.decisions[decision].LL_MinLook==0 ? LL_k : Math.min(this.decisions[decision].LL_MinLook, LL_k);
				if (LL_k > this.decisions[decision].LL_MaxLook) {
					this.decisions[decision].LL_MaxLook = LL_k;
					this.decisions[decision].LL_MaxLookEvent =
							new LookaheadEventInfo(decision, null, alt, input, this._startIndex, this._llStopIndex, true);
				}
			}
			return alt;
		}
		finally {
			this.currentDecision = -1;
		}
	}

	getExistingTargetState(previousD, t) {
		// this method is called after each time the input position advances
		// during SLL prediction
		this._sllStopIndex = this._input.index();
		var existingTargetState = super.getExistingTargetState(previousD, t);
		if (existingTargetState != null) {
			this.decisions[this.currentDecision].SLL_DFATransitions++; // count only if we transition over a DFA state
			if (existingTargetState === ATNSimulator.ERROR) {
				this.decisions[this.currentDecision].errors.push(
						new ErrorInfo(this.currentDecision, previousD.configs, this._input, this._startIndex, this._sllStopIndex, false)
				);
			}
		}
		this.currentState = existingTargetState;
		return existingTargetState;
	}

	computeTargetState(dfa, previousD, t) {
		var state = super.computeTargetState(dfa, previousD, t);
		this.currentState = state;
		return state;
	}

	computeReachSet(closure, t, fullCtx) {
		if (fullCtx) {
			// this method is called after each time the input position advances
			// during full context prediction
			this._llStopIndex = this._input.index();
		}

		var reachConfigs = super.computeReachSet(closure, t, fullCtx);
		if (fullCtx) {
			this.decisions[this.currentDecision].LL_ATNTransitions++; // count computation even if error
			if (reachConfigs != null) {}
			else { // no reach on current lookahead symbol. ERROR.
				// TODO: does not handle delayed errors per getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule()
				this.decisions[this.currentDecision].errors.push(
					new ErrorInfo(this.currentDecision, closure, this._input, this._startIndex, this._llStopIndex, true)
				);
			}
		}
		else {
			this.decisions[this.currentDecision].SLL_ATNTransitions++;
			if (reachConfigs != null) {}
			else { // no reach on current lookahead symbol. ERROR.
				this.decisions[this.currentDecision].errors.push(
					new ErrorInfo(this.currentDecision, closure, this._input, this._startIndex, this._sllStopIndex, false)
				);
			}
		}
		return reachConfigs;
	}

	evalSemanticContext(pred, parserCallStack, alt, fullCtx) {
		var result = super.evalSemanticContext(pred, parserCallStack, alt, fullCtx);
		if (!(pred instanceof SemanticContext.PrecedencePredicate)) {
			var fullContext = this._llStopIndex >= 0;
			var stopIndex = fullContext ? this._llStopIndex : this._sllStopIndex;
			this.decisions[this.currentDecision].predicateEvals.push(
				new PredicateEvalInfo(this.currentDecision, this._input, this._startIndex, stopIndex, pred, result, alt, fullCtx)
			);
		}
		return result;
	}

	reportAttemptingFullContext(dfa, conflictingAlts, configs, startIndex, stopIndex) {
		if (conflictingAlts != null) {
			this.conflictingAltResolvedBySLL = conflictingAlts.ntz();
		}
		else {
			this.conflictingAltResolvedBySLL = configs.getAlts().ntz();
		}
		this.decisions[this.currentDecision].LL_Fallback++;
		super.reportAttemptingFullContext(dfa, conflictingAlts, configs, startIndex, stopIndex);
	}

	reportContextSensitivity(dfa, prediction, configs, startIndex, stopIndex) {
		if (prediction !== this.conflictingAltResolvedBySLL) {
			this.decisions[this.currentDecision].contextSensitivities.push(
					new ContextSensitivityInfo(this.currentDecision, configs, this._input, startIndex, stopIndex)
			);
		}
		super.reportContextSensitivity(dfa, prediction, configs, startIndex, stopIndex);
	}

	reportAmbiguity(dfa, D, startIndex, stopIndex, exact, ambigAlts, configs) {
        /**
         * @type {number}
         */
		var prediction;
		if (ambigAlts != null) {
			prediction = ambigAlts.ntz();
		}
		else {
			prediction = configs.getAlts().ntz();
		}
		if (configs.fullCtx && (prediction !== this.conflictingAltResolvedBySLL)) {
			// Even though this is an ambiguity we are reporting, we can
			// still detect some context sensitivities.  Both SLL and LL
			// are showing a conflict, hence an ambiguity, but if they resolve
			// to different minimum alternatives we have also identified a
			// context sensitivity.
			this.decisions[this.currentDecision].contextSensitivities.push(
					new ContextSensitivityInfo(this.currentDecision, configs, this._input, startIndex, stopIndex)
			);
		}
		this.decisions[this.currentDecision].ambiguities.push(
			new AmbiguityInfo(this.currentDecision, configs, ambigAlts,
							  this._input, startIndex, stopIndex, configs.fullCtx)
		);
		super.reportAmbiguity(dfa, D, startIndex, stopIndex, exact, ambigAlts, configs);
	}

	/**
     * @return {Array<DecisionInfo>}
     */
	getDecisionInfo() {
		return this.decisions;
	}

    /**
     * @return {org.antlr.v4.runtime.dfa.DFAState}
     */
	getCurrentState() {
		return this.currentState;
    }
}


exports = ProfilingATNSimulator;
