/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LexerModeAction');
goog.module.declareLegacyNamespace();


const LexerAction = goog.require('org.antlr.v4.runtime.atn.LexerAction');
const LexerActionType = goog.require('org.antlr.v4.runtime.atn.LexerActionType');
const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');
const {format} = goog.require('goog.string');

/**
 * Implements the {@code mode} lexer action by calling {@link Lexer#mode} with
 * the assigned mode.
 *
 * @author Sam Harwell
 * @since 4.2
 *
 * @implements {LexerAction}
 */
class LexerModeAction {
    /**
     * Constructs a new {@code mode} action with the specified mode value.
     *
     * @param {number} mode The mode value to pass to {@link Lexer#mode}.
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
     * @return {number} The lexer mode for this {@code mode} command.
     */
    getMode() {
        return this.mode;
    }

    getActionType() {
        return LexerActionType.MODE;
    }

    isPositionDependent() {
        return false;
    }

    execute(lexer) {
        lexer.mode(this.mode);
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
        else if (!(obj instanceof LexerModeAction)) {
            return false;
        }

        return this.mode === obj.mode;
    }

    /**
     * @return {string}
     */
    toString() {
        return format("mode(%d)", this.mode);
    }
}


exports = LexerModeAction;
