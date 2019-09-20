/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LexerMoreAction');


const LexerAction = goog.require('org.antlr.v4.runtime.atn.LexerAction');
const LexerActionType = goog.require('org.antlr.v4.runtime.atn.LexerActionType');
const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');
const {format} = goog.require('goog.string');

/**
 * Implements the {@code more} lexer action by calling {@link Lexer#more}.
 *
 * <p>The {@code more} command does not have any parameters, so this action is
 * implemented as a singleton instance exposed by {@link #INSTANCE}.</p>
 *
 * @author Sam Harwell
 * @since 4.2
 *
 * @implements {LexerAction}
 */
class LexerMoreAction {
	getActionType() {
		return LexerActionType.MORE;
	}

	isPositionDependent() {
		return false;
	}

	execute(lexer) {
		lexer.more();
	}

    /**
     * @return {number}
     */
	hashCode() {
		var hash = MurmurHash.initialize();
		hash = MurmurHash.update(hash, this.getActionType());
		return MurmurHash.finish(hash, 1);
	}

    /**
     * @param {Object} obj
     * @return {boolean}
     */
    equals(obj) {
		return obj === this;
	}

    /**
     * @return {string}
     */
    toString() {
		return "more";
	}
}

/**
 * Provides a singleton instance of this parameterless lexer action.
 */
LexerMoreAction.INSTANCE = new LexerMoreAction();


exports = LexerMoreAction;
