/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LexerIndexedCustomAction');


const LexerAction = goog.require('org.antlr.v4.runtime.atn.LexerAction');
const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');

/**
 * This implementation of {@link LexerAction} is used for tracking input offsets
 * for position-dependent actions within a {@link LexerActionExecutor}.
 *
 * <p>This action is not serialized as part of the ATN, and is only required for
 * position-dependent lexer actions which appear at a location other than the
 * end of a rule. For more information about DFA optimizations employed for
 * lexer actions, see {@link LexerActionExecutor#append} and
 * {@link LexerActionExecutor#fixOffsetBeforeMatch}.</p>
 *
 * @author Sam Harwell
 * @since 4.2
 *
 * @implements {LexerAction}
 */
class LexerIndexedCustomAction {
	/**
	 * Constructs a new indexed custom action by associating a character offset
	 * with a {@link LexerAction}.
	 *
	 * <p>Note: This class is only required for lexer actions for which
	 * {@link LexerAction#isPositionDependent} returns {@code true}.</p>
	 *
	 * @param {number} offset The offset into the input {@link CharStream}, relative to
	 * the token start index, at which the specified lexer action should be
	 * executed.
	 * @param {LexerAction} action The lexer action to execute at a particular offset in the
	 * input {@link CharStream}.
	 */
	constructor(offset, action) {
        /**
         * @type {number}
         */
        this.offset = offset;
        /**
         * @type {LexerAction}
         */
		this.action = action;
	}

	/**
	 * Gets the location in the input {@link CharStream} at which the lexer
	 * action should be executed. The value is interpreted as an offset relative
	 * to the token start index.
	 *
	 * @return {number} The location in the input {@link CharStream} at which the lexer
	 * action should be executed.
	 */
	getOffset() {
		return this.offset;
	}

	/**
	 * Gets the lexer action to execute.
	 *
	 * @return {LexerAction} A {@link LexerAction} object which executes the lexer action.
	 */
	getAction() {
		return this.action;
	}

	getActionType() {
		return this.action.getActionType();
	}

	isPositionDependent() {
		return true;
	}

	execute(lexer) {
		// assume the input stream position was properly set by the calling code
		this.action.execute(lexer);
	}

    /**
     * @return {number}
     */
	hashCode() {
		var hash = MurmurHash.initialize();
		hash = MurmurHash.update(hash, this.offset);
		hash = MurmurHash.update(hash, this.action);
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
		else if (!(obj instanceof LexerIndexedCustomAction)) {
			return false;
        }

		return this.offset === obj.offset
			&& this.action.equals(obj.action);
	}
}


exports = LexerIndexedCustomAction;
