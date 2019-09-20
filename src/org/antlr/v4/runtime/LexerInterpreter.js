/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.LexerInterpreter');


const Lexer = goog.require('org.antlr.v4.runtime.Lexer');
const ATN = goog.require('org.antlr.v4.runtime.atn.ATN');
const ATNType = goog.require('org.antlr.v4.runtime.atn.ATNType');
const LexerATNSimulator = goog.require('org.antlr.v4.runtime.atn.LexerATNSimulator');
const PredictionContextCache = goog.require('org.antlr.v4.runtime.atn.PredictionContextCache');
const DFA = goog.require('org.antlr.v4.runtime.dfa.DFA');

class LexerInterpreter extends Lexer {
    /**
     * @param {string} grammarFileName
     * @param {org.antlr.v4.runtime.Vocabulary} vocabulary
     * @param {Array<string>} ruleNames
     * @param {Array<string>} channelNames
     * @param {Array<string>} modeNames
     * @param {ATN} atn
     * @param {org.antlr.v4.runtime.CharStream} input
     */
    constructor(grammarFileName, vocabulary, ruleNames, channelNames, modeNames, atn, input) {
        super(input);

        if (atn.grammarType != ATNType.LEXER) {
            throw new Error("The ATN must be a lexer ATN.");
        }

        /**
         * @protected {string}
         */
        this.grammarFileName = grammarFileName;
        /**
         * @protected {ATN}
         */
        this.atn = atn;
        /**
         * @protected {Array<string>}
         */
        this.tokenNames = [];
        for (var i = 0; i < atn.maxTokenType; i++) {
            this.tokenNames[i] = vocabulary.getDisplayName(i);
        }
        /**
         * @protected {Array<string>}
         */
        this.ruleNames = ruleNames;
        /**
         * @protected {Array<string>}
         */
        this.channelNames = channelNames;
        /**
         * @protected {Array<string>}
         */
        this.modeNames = modeNames;
        /**
         * @private {org.antlr.v4.runtime.Vocabulary}
         */
        this.vocabulary = vocabulary;
        /**
         * @protected {Array<DFA>}
         */
        this._decisionToDFA = [];
        for (var i = 0; i < atn.getNumberOfDecisions(); i++) {
            this._decisionToDFA[i] = new DFA(atn.getDecisionState(i), i);
        }
        /**
         * @protected {PredictionContextCache}
         */
        this._sharedContextCache = new PredictionContextCache();
        this._interp = new LexerATNSimulator(this, atn, this._decisionToDFA, this._sharedContextCache);
    }

    getATN() {
        return this.atn;
    }

    getGrammarFileName() {
        return this.grammarFileName;
    }

    getTokenNames() {
        return this.tokenNames;
    }

    getRuleNames() {
        return this.ruleNames;
    }

    getChannelNames() {
        return this.channelNames;
    }

    getModeNames() {
        return this.modeNames;
    }

    getVocabulary() {
        if (this.vocabulary != null) {
            return this.vocabulary;
        }

        return super.getVocabulary();
    }
};


exports = LexerInterpreter;
