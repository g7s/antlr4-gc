/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LexerActionExecutor');
goog.module.declareLegacyNamespace();


const LexerAction = goog.require('org.antlr.v4.runtime.atn.LexerAction');
const LexerIndexedCustomAction = goog.require('org.antlr.v4.runtime.atn.LexerIndexedCustomAction');
const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');
const {every} = goog.require('goog.array');

/**
 * Represents an executor for a sequence of lexer actions which traversed during
 * the matching operation of a lexer rule (token).
 *
 * <p>The executor tracks position information for position-dependent lexer actions
 * efficiently, ensuring that actions appearing only at the end of the rule do
 * not cause bloating of the {@link DFA} created for the lexer.</p>
 *
 * @author Sam Harwell
 * @since 4.2
 */
class LexerActionExecutor {
	/**
	 * Constructs an executor for a sequence of {@link LexerAction} actions.
	 * @param {!Array<LexerAction>} lexerActions The lexer actions to execute.
	 */
	constructor(lexerActions) {
        /**
         * @private {!Array<LexerAction>}
         */
		this.lexerActions = lexerActions;

		var hash = MurmurHash.initialize();
		for (const lexerAction of lexerActions) {
			hash = MurmurHash.update(hash, lexerAction);
		}

        /**
         * Caches the result of {@link #hashCode} since the hash code is an element
         * of the performance-critical {@link LexerATNConfig#hashCode} operation.
         *
         * @private {number}
         */
		this._hashCode = MurmurHash.finish(hash, lexerActions.length);
	}

	/**
	 * Creates a {@link LexerActionExecutor} which encodes the current offset
	 * for position-dependent lexer actions.
	 *
	 * <p>Normally, when the executor encounters lexer actions where
	 * {@link LexerAction#isPositionDependent} returns {@code true}, it calls
	 * {@link IntStream#seek} on the input {@link CharStream} to set the input
	 * position to the <em>end</em> of the current token. This behavior provides
	 * for efficient DFA representation of lexer actions which appear at the end
	 * of a lexer rule, even when the lexer rule matches a variable number of
	 * characters.</p>
	 *
	 * <p>Prior to traversing a match transition in the ATN, the current offset
	 * from the token start index is assigned to all position-dependent lexer
	 * actions which have not already been assigned a fixed offset. By storing
	 * the offsets relative to the token start index, the DFA representation of
	 * lexer actions which appear in the middle of tokens remains efficient due
	 * to sharing among tokens of the same length, regardless of their absolute
	 * position in the input stream.</p>
	 *
	 * <p>If the current executor already has offsets assigned to all
	 * position-dependent lexer actions, the method returns {@code this}.</p>
	 *
	 * @param {number} offset The current offset to assign to all position-dependent
	 * lexer actions which do not already have offsets assigned.
	 *
	 * @return {LexerActionExecutor} A {@link LexerActionExecutor} which stores input stream offsets
	 * for all position-dependent lexer actions.
	 */
	fixOffsetBeforeMatch(offset) {
        /**
         * @type {Array<LexerAction>}
         */
		var updatedLexerActions = null;
		for (var i = 0; i < this.lexerActions.length; i++) {
			if (this.lexerActions[i].isPositionDependent() && !(this.lexerActions[i] instanceof LexerIndexedCustomAction)) {
				if (updatedLexerActions == null) {
					updatedLexerActions = this.lexerActions.slice(0);
				}

				updatedLexerActions[i] = new LexerIndexedCustomAction(offset, this.lexerActions[i]);
			}
		}

		if (updatedLexerActions == null) {
			return this;
		}

		return new LexerActionExecutor(updatedLexerActions);
	}

	/**
	 * Gets the lexer actions to be executed by this executor.
	 * @return {Array<LexerAction>} The lexer actions to be executed by this executor.
	 */
	getLexerActions() {
		return this.lexerActions;
	}

	/**
	 * Execute the actions encapsulated by this executor within the context of a
	 * particular {@link Lexer}.
	 *
	 * <p>This method calls {@link IntStream#seek} to set the position of the
	 * {@code input} {@link CharStream} prior to calling
	 * {@link LexerAction#execute} on a position-dependent action. Before the
	 * method returns, the input position will be restored to the same position
	 * it was in when the method was invoked.</p>
	 *
	 * @param {org.antlr.v4.runtime.Lexer} lexer The lexer instance.
	 * @param {org.antlr.v4.runtime.CharStream} input The input stream which
     * is the source for the current token.
	 * When this method is called, the current {@link IntStream#index} for
	 * {@code input} should be the start of the following token, i.e. 1
	 * character past the end of the current token.
	 * @param {number} startIndex The token start index. This value may be passed to
	 * {@link IntStream#seek} to set the {@code input} position to the beginning
	 * of the token.
     * @return {void}
	 */
	execute(lexer, input, startIndex) {
		var requiresSeek = false;
		var stopIndex = input.index();
		try {
			for (var lexerAction of this.lexerActions) {
				if (lexerAction instanceof LexerIndexedCustomAction) {
                    /**
                     * @type {number}
                     */
					var offset = lexerAction.getOffset();
					input.seek(startIndex + offset);
					lexerAction = lexerAction.getAction();
					requiresSeek = (startIndex + offset) !== stopIndex;
				}
				else if (lexerAction.isPositionDependent()) {
					input.seek(stopIndex);
					requiresSeek = false;
				}

				lexerAction.execute(lexer);
			}
		}
		finally {
			if (requiresSeek) {
				input.seek(stopIndex);
			}
		}
	}

    /**
     * @return {number}
     */
	hashCode() {
		return this._hashCode;
	}

    /**
     * @param {Object} obj
     * @return {boolean}
     */
    equals(obj) {
		if (obj === this) {
			return true;
		}
		else if (!(obj instanceof LexerActionExecutor)) {
			return false;
		}

		return this._hashCode === obj._hashCode
            && every(this.lexerActions, (la, i) => la.equals(obj.lexerActions[i]));
	}
}

/**
 * Creates a {@link LexerActionExecutor} which executes the actions for
 * the input {@code lexerActionExecutor} followed by a specified
 * {@code lexerAction}.
 *
 * @param {LexerActionExecutor} lexerActionExecutor The executor for actions already traversed by
 * the lexer while matching a token within a particular
 * {@link LexerATNConfig}. If this is {@code null}, the method behaves as
 * though it were an empty executor.
 * @param {LexerAction} lexerAction The lexer action to execute after the actions
 * specified in {@code lexerActionExecutor}.
 *
 * @return {LexerActionExecutor} A {@link LexerActionExecutor} for executing the combine actions
 * of {@code lexerActionExecutor} and {@code lexerAction}.
 */
LexerActionExecutor.append = function (lexerActionExecutor, lexerAction) {
    if (lexerActionExecutor == null) {
        return new LexerActionExecutor([lexerAction]);
    }

    var lexerActions = lexerActionExecutor.lexerActions.slice(0);
    lexerActions.push(lexerAction);
    return new LexerActionExecutor(lexerActions);
};


exports = LexerActionExecutor;
