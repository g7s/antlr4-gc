/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.dfa.DFASerializer');


const Vocabulary = goog.require('org.antlr.v4.runtime.Vocabulary');
const VocabularyImpl = goog.require('org.antlr.v4.runtime.VocabularyImpl');

/**
 * A DFA walker that knows how to dump them to serialized strings.
 */
class DFASerializer {
    /**
     * @param {org.antlr.v4.runtime.dfa.DFA} dfa
     * @param {org.antlr.v4.runtime.Vocabulary} vocabulary
     */
    constructor(dfa, vocabulary) {
        /**
         * @private {org.antlr.v4.runtime.dfa.DFA}
         */
        this.dfa = dfa;
        /**
         * @private {org.antlr.v4.runtime.Vocabulary}
         */
        this.vocabulary = vocabulary;
    }

    /**
     * @return {string}
     */
    toString() {
        if (this.dfa.s0 == null) return "";
        var str = "";
        var states = this.dfa.getStates();
        states.forEach(s => {
            var n = s.edges.length;
            for (var i = 0; i < n; i++) {
                var t = s.edges[i];
                if (t != null && t.stateNumber !== Number.MAX_VALUE) {
                    str += (this.getStateString(s) + "-" + this.getEdgeLabel(i) + "->" + this.getStateString(t) + "\n");
                }
            }
        });
        if (str.length === 0) return "";
        return str;
    }

    /**
     * @protected
     * @param {number} i
     * @return {string}
     */
    getEdgeLabel(i) {
        return this.vocabulary.getDisplayName(i - 1);
    }

    /**
     * @protected
     * @param {org.antlr.v4.runtime.dfa.DFAState} s
     * @return {string}
     */
    getStateString(s) {
        var n = s.stateNumber;
        var baseStateStr = (s.isAcceptState ? ":" : "") + "s" + n + (s.requiresFullContext ? "^" : "");
        if (s.isAcceptState) {
            if (s.predicates != null) {
                return baseStateStr + "=>" + "[" + s.predicates.map(p => p.toString()).join(", ") + "]";
            }
            else {
                return baseStateStr + "=>" + s.prediction;
            }
        }
        else {
            return baseStateStr;
        }
    }
}


exports = DFASerializer;
