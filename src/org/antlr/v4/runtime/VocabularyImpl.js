/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.VocabularyImpl');


const Vocabulary = goog.require('org.antlr.v4.runtime.Vocabulary');
const Token = goog.require('org.antlr.v4.runtime.Token');
const {isEmptyOrWhitespace} = goog.require('goog.string');

/**
 * This class provides a default implementation of the {@link Vocabulary}
 * interface.
 *
 * @author Sam Harwell
 */
class VocabularyImpl extends Vocabulary {
	/**
	 * Constructs a new instance of {@link VocabularyImpl} from the specified
	 * literal, symbolic, and display token names.
	 *
	 * @param {Array.<?string>=} literalNames The literal names assigned to tokens, or {@code null}
	 * if no literal names are assigned.
	 * @param {Array.<?string>=} symbolicNames The symbolic names assigned to tokens, or
	 * {@code null} if no symbolic names are assigned.
	 * @param {Array.<?string>=} displayNames The display names assigned to tokens, or {@code null}
	 * to use the values in {@code literalNames} and {@code symbolicNames} as
	 * the source of display names, as described in
	 * {@link #getDisplayName(int)}.
	 *
	 * @see #getLiteralName(int)
	 * @see #getSymbolicName(int)
	 * @see #getDisplayName(int)
	 */
	constructor(literalNames, symbolicNames, displayNames) {
        /**
         * @private {!Array.<?string>}
         */
        this.literalNames = literalNames || VocabularyImpl.EMPTY_NAMES;
        /**
         * @private {!Array.<?string>}
         */
        this.symbolicNames = symbolicNames || VocabularyImpl.EMPTY_NAMES;
        /**
         * @private {!Array.<?string>}
         */
		this.displayNames = displayNames || VocabularyImpl.EMPTY_NAMES;
        // See note here on -1 part: https://github.com/antlr/antlr4/pull/1146
        /**
         * @private {number}
         */
		this.maxTokenType =
			Math.max(this.displayNames.length,
					 Math.max(this.literalNames.length, this.symbolicNames.length)) - 1;
	}

	getMaxTokenType() {
		return this.maxTokenType;
	}

    getLiteralName(tokenType) {
		if (tokenType >= 0 && tokenType < this.literalNames.length) {
			return this.literalNames[tokenType];
		}
		return null;
	}

	getSymbolicName(tokenType) {
		if (tokenType >= 0 && tokenType < this.symbolicNames.length) {
			return this.symbolicNames[tokenType];
		}
		if (tokenType == Token.EOF) {
			return "EOF";
		}
		return null;
	}

	getDisplayName(tokenType) {
		if (tokenType >= 0 && tokenType < this.displayNames.length) {
			displayName = this.displayNames[tokenType];
			if (displayName !== null) {
				return displayName;
			}
		}
		let literalName = this.getLiteralName(tokenType);
		if (literalName !== null) {
			return literalName;
		}
		let symbolicName = this.getSymbolicName(tokenType);
		if (symbolicName !== null) {
			return symbolicName;
		}
		return "" + tokenType;
    }


};

/**
 * @type {!Array.<string>}
 * @private
 * @final
 */
VocabularyImpl.EMPTY_NAMES = [];

/**
 * Gets an empty {@link Vocabulary} instance.
 *
 * <p>
 * No literal or symbol names are assigned to token types, so
 * {@link #getDisplayName(int)} returns the numeric value for all tokens
 * except {@link Token#EOF}.</p>
 *
 * @type {VocabularyImpl}
 * @final
 */
VocabularyImpl.EMPTY_VOCABULARY = new VocabularyImpl(
    VocabularyImpl.EMPTY_NAMES,
    VocabularyImpl.EMPTY_NAMES,
    VocabularyImpl.EMPTY_NAMES
);


/**
 * Returns a {@link VocabularyImpl} instance from the specified set of token
 * names. This method acts as a compatibility layer for the single
 * {@code tokenNames} array generated by previous releases of ANTLR.
 *
 * <p>The resulting vocabulary instance returns {@code null} for
 * {@link #getLiteralName(int)} and {@link #getSymbolicName(int)}, and the
 * value from {@code tokenNames} for the display names.</p>
 *
 * @param {!Array.<?string>} tokenNames The token names, or {@code null} if no token names are
 * available.
 * @return {Vocabulary} A {@link Vocabulary} instance which uses {@code tokenNames} for
 * the display names of tokens.
 */
VocabularyImpl.fromTokenNames = function (tokenNames) {
    if (tokenNames == null || tokenNames.length == 0) {
        return VocabularyImpl.EMPTY_VOCABULARY;
    }
    let literalNames = tokenNames.slice(0);
    let symbolicNames = tokenNames.slice(0);
    for (var i = 0; i < tokenNames.length; i++) {
        let tokenName = tokenNames[i];
        if (tokenName === null) {
            continue;
        }

        if (!isEmptyOrWhitespace(tokenName)) {
            let firstChar = tokenName.charAt(0);
            if (firstChar == '\'') {
                symbolicNames[i] = null;
                continue;
            }
            else if (firstChar === firstChar.toUpperCase()) {
                literalNames[i] = null;
                continue;
            }
        }

        // wasn't a literal or symbolic name
        literalNames[i] = null;
        symbolicNames[i] = null;
    }

    return new VocabularyImpl(literalNames, symbolicNames, tokenNames);
};


exports = VocabularyImpl;
