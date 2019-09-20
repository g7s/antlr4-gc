/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LexerTypeAction');


const LexerAction = goog.require('org.antlr.v4.runtime.atn.LexerAction');
const LexerActionType = goog.require('org.antlr.v4.runtime.atn.LexerActionType');
const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');
const {format} = goog.require('goog.string');

/**
 * Implements the {@code type} lexer action by calling {@link Lexer#setType}
 * with the assigned type.
 *
 * @author Sam Harwell
 * @since 4.2
 *
 * @implements {LexerAction}
 */
class LexerTypeAction {
	/**
	 * Constructs a new {@code type} action with the specified token type value.
	 * @param {number} type The type to assign to the token using {@link Lexer#setType}.
	 */
	constructor(type) {
        /**
         * @private {number}
         */
		this.type = type;
	}

	/**
	 * Gets the type to assign to a token created by the lexer.
	 * @return {number} The type to assign to a token created by the lexer.
	 */
	getType() {
		return this.type;
	}

	getActionType() {
		return LexerActionType.TYPE;
	}

	isPositionDependent() {
		return false;
	}

	execute(lexer) {
		lexer.setType(this.type);
	}

    /**
     * @return {number}
     */
	hashCode() {
		var hash = MurmurHash.initialize();
		hash = MurmurHash.update(hash, this.getActionType());
		hash = MurmurHash.update(hash, this.type);
		return MurmurHash.finish(hash, 2);
	}

    /**
     * @param {Object} obj
     * @return {boolean}
     */
	equals(obj) {
		if (obj === this) {
			return true;
		}
		else if (!(obj instanceof LexerTypeAction)) {
			return false;
		}
		return this.type === obj.type;
	}

    /**
     * @return {string}
     */
	toString() {
		return format("type(%d)", this.type);
	}
}


exports = LexerTypeAction;
