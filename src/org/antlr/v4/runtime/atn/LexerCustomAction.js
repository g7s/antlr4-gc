/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LexerCustomAction');


const LexerAction = goog.require('org.antlr.v4.runtime.atn.LexerAction');
const LexerActionType = goog.require('org.antlr.v4.runtime.atn.LexerActionType');
const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');

/**
 * Executes a custom lexer action by calling {@link Recognizer#action} with the
 * rule and action indexes assigned to the custom action. The implementation of
 * a custom action is added to the generated code for the lexer in an override
 * of {@link Recognizer#action} when the grammar is compiled.
 *
 * <p>This class may represent embedded actions created with the <code>{...}</code>
 * syntax in ANTLR 4, as well as actions created for lexer commands where the
 * command argument could not be evaluated when the grammar was compiled.</p>
 *
 * @author Sam Harwell
 * @since 4.2
 *
 * @implements {LexerAction}
 */
class LexerCustomAction {
	/**
	 * Constructs a custom lexer action with the specified rule and action
	 * indexes.
	 *
	 * @param {number} ruleIndex The rule index to use for calls to
	 * {@link Recognizer#action}.
	 * @param {number} actionIndex The action index to use for calls to
	 * {@link Recognizer#action}.
	 */
	constructor(ruleIndex, actionIndex) {
        /**
         * @private {number}
         */
        this.ruleIndex = ruleIndex;
        /**
         * @private {number}
         */
		this.actionIndex = actionIndex;
	}

	/**
	 * Gets the rule index to use for calls to {@link Recognizer#action}.
	 *
	 * @return {number} The rule index for the custom action.
	 */
	getRuleIndex() {
		return this.ruleIndex;
	}

	/**
	 * Gets the action index to use for calls to {@link Recognizer#action}.
	 *
	 * @return {number} The action index for the custom action.
	 */
	getActionIndex() {
		return this.actionIndex;
	}

	getActionType() {
		return LexerActionType.CUSTOM;
	}

	isPositionDependent() {
		return true;
	}

	execute(lexer) {
		lexer.action(null, this.ruleIndex, this.actionIndex);
	}

    /**
     * @return {number}
     */
	hashCode() {
		var hash = MurmurHash.initialize();
		hash = MurmurHash.update(hash, this.getActionType());
		hash = MurmurHash.update(hash, this.ruleIndex);
		hash = MurmurHash.update(hash, this.actionIndex);
		return MurmurHash.finish(hash, 3);
	}

    /**
     * @param {Object} obj
     * @return {boolean}
     */
    equals(obj) {
		if (obj === this) {
			return true;
		}
		else if (!(obj instanceof LexerCustomAction)) {
			return false;
		}

		return this.ruleIndex === obj.ruleIndex
			&& this.actionIndex === obj.actionIndex;
	}
}


exports = LexerCustomAction;
