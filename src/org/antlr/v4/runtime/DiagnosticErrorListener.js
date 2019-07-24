/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.DiagnosticErrorListener');


const BaseErrorListener = goog.require('org.antlr.v4.runtime.BaseErrorListener');
const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');
const {format} = goog.require('goog.string');

/**
 * @param {org.antlr.v4.runtime.Parser} recognizer
 * @param {org.antlr.v4.runtime.dfa.DFA} dfa
 * @return {string}
 */
function getDecisionDescription(recognizer, dfa) {
    let /** number */ decision = dfa.decision;
    let /** number */ ruleIndex = dfa.atnStartState.ruleIndex;

    let /** Array.<string> */ ruleNames = recognizer.getRuleNames();
    if (ruleIndex < 0 || ruleIndex >= ruleNames.length) {
        return decision.toString();
    }

    let /** string */ ruleName = ruleNames[ruleIndex];
    if (ruleName === null || ruleName.isEmpty()) {
        return decision.toString();
    }

    return format("%d (%s)", decision, ruleName);
}

/**
 * Computes the set of conflicting or ambiguous alternatives from a
 * configuration set, if that information was not already provided by the
 * parser.
 *
 * @param {org.antlr.v4.runtime.misc.BitSet=} reportedAlts The set of conflicting
 * or ambiguous alternatives, as reported by the parser.
 * @param {org.antlr.v4.runtime.atn.ATNConfigSet} configs The conflicting or
 * ambiguous configuration set.
 * @return {org.antlr.v4.runtime.misc.BitSet} Returns {@code reportedAlts}
 * if it is not {@code null}, otherwise returns the set of alternatives
 * represented in {@code configs}.
 */
function getConflictingAlts(reportedAlts, configs) {
    if (reportedAlts != null) {
        return reportedAlts;
    }

    let /** org.antlr.v4.runtime.misc.BitSet */ result = new BitSet();
    configs.forEach(config => {
        result.set(config.alt);
    });
    return result;
}

/**
 * This implementation of {@link ANTLRErrorListener} can be used to identify
 * certain potential correctness and performance problems in grammars. "Reports"
 * are made by calling {@link Parser#notifyErrorListeners} with the appropriate
 * message.
 *
 * <ul>
 * <li><b>Ambiguities</b>: These are cases where more than one path through the
 * grammar can match the input.</li>
 * <li><b>Weak context sensitivity</b>: These are cases where full-context
 * prediction resolved an SLL conflict to a unique alternative which equaled the
 * minimum alternative of the SLL conflict.</li>
 * <li><b>Strong (forced) context sensitivity</b>: These are cases where the
 * full-context prediction resolved an SLL conflict to a unique alternative,
 * <em>and</em> the minimum alternative of the SLL conflict was found to not be
 * a truly viable alternative. Two-stage parsing cannot be used for inputs where
 * this situation occurs.</li>
 * </ul>
 *
 * @author Sam Harwell
 */
class DiagnosticErrorListener extends BaseErrorListener {
    /**
     * @param {boolean=} exactOnly
     */
    constructor(exactOnly) {
        this.exactOnly = exactOnly || true;
    }

    reportAmbiguity(recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs) {
        if (this.exactOnly && !exact) {
            return;
        }

        let fmt = "reportAmbiguity d=%s: ambigAlts=%s, input='%s'";
        let decision = getDecisionDescription(recognizer, dfa);
        let conflictingAlts = getConflictingAlts(ambigAlts, configs);
        let text = recognizer.getTokenStream().getText(Interval.of(startIndex, stopIndex));
        let message = format(fmt, decision, conflictingAlts, text);
        recognizer.notifyErrorListeners(message);
    }

    reportAttemptingFullContext(recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs) {
        let fmt = "reportAttemptingFullContext d=%s, input='%s'";
        let decision = getDecisionDescription(recognizer, dfa);
        let text = recognizer.getTokenStream().getText(Interval.of(startIndex, stopIndex));
        let message = format(fmt, decision, text);
        recognizer.notifyErrorListeners(message);
    }

    reportContextSensitivity(recognizer, dfa, startIndex, stopIndex, prediction, configs) {
        let fmt = "reportContextSensitivity d=%s, input='%s'";
        let decision = getDecisionDescription(recognizer, dfa);
        let text = recognizer.getTokenStream().getText(Interval.of(startIndex, stopIndex));
        let message = format(fmt, decision, text);
        recognizer.notifyErrorListeners(message);
    }
};

exports = DiagnosticErrorListener;
