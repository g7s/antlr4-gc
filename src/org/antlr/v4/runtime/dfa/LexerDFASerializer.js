/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.dfa.LexerDFASerializer');
goog.module.declareLegacyNamespace();


const DFASerializer = goog.require('org.antlr.v4.runtime.dfa.DFASerializer');
const VocabularyImpl = goog.require('org.antlr.v4.runtime.VocabularyImpl');

class LexerDFASerializer extends DFASerializer {
    /**
     * @param {org.antlr.v4.runtime.dfa.DFA} dfa
     */
	constructor(dfa) {
		super(dfa, VocabularyImpl.EMPTY_VOCABULARY);
	}

    /**
     * @override
     */
	getEdgeLabel(i) {
        return ("'" + String.fromCodePoint(i) + "'");
	}
}


exports = LexerDFASerializer;
