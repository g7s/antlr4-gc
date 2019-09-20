/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LexerPushModeAction');


const LexerAction = goog.require('org.antlr.v4.runtime.atn.LexerAction');
const LexerActionType = goog.require('org.antlr.v4.runtime.atn.LexerActionType');
const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');
const {format} = goog.require('goog.string');

/**
 * Implements the {@code pushMode} lexer action by calling
 * {@link Lexer#pushMode} with the assigned mode.
 *
 * @author Sam Harwell
 * @since 4.2
 *
 * @implements {LexerAction}
 */
class LexerPushModeAction {
	/**
	 * Constructs a new {@code pushMode} action with the specified mode value.
	 * @param {number} mode The mode value to pass to {@link Lexer#pushMode}.
	 */
	constructor(mode) {
        /**
         * @private {number}
         */
		this.mode = mode;
	}

	/**
	 * Get the lexer mode this action should transition the lexer to.
	 *
	 * @return {number} The lexer mode for this {@code pushMode} command.
	 */
	getMode() {
		return this.mode;
	}

	getActionType() {
		return LexerActionType.PUSH_MODE;
	}

    isPositionDependent() {
		return false;
	}

	execute(lexer) {
		lexer.pushMode(this.mode);
	}

    /**
     * @return {number}
     */
	hashCode() {
		var hash = MurmurHash.initialize();
		hash = MurmurHash.update(hash, this.getActionType());
		hash = MurmurHash.update(hash, this.mode);
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
		else if (!(obj instanceof LexerPushModeAction)) {
			return false;
		}

		return this.mode === obj.mode;
	}

    /**
     * @return {string}
     */
	toString() {
		return format("pushMode(%d)", this.mode);
	}
}


exports = LexerPushModeAction;
