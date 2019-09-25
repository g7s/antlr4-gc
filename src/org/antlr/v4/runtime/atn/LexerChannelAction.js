/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LexerChannelAction');
goog.module.declareLegacyNamespace();


const LexerAction = goog.require('org.antlr.v4.runtime.atn.LexerAction');
const LexerActionType = goog.require('org.antlr.v4.runtime.atn.LexerActionType');
const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');
const {format} = goog.require('goog.string');

/**
 * Implements the {@code channel} lexer action by calling
 * {@link Lexer#setChannel} with the assigned channel.
 *
 * @author Sam Harwell
 * @since 4.2
 *
 * @implements {LexerAction}
 */
class LexerChannelAction {
    /**
     * Constructs a new {@code channel} action with the specified channel value.
     * @param {number} channel The channel value to pass to {@link Lexer#setChannel}.
     */
    constructor(channel) {
        /**
         * @private {number}
         */
        this.channel = channel;
    }

    /**
     * Gets the channel to use for the {@link Token} created by the lexer.
     *
     * @return {number} The channel to use for the {@link Token} created by the lexer.
     */
    getChannel() {
        return this.channel;
    }

    getActionType() {
        return LexerActionType.CHANNEL;
    }

    isPositionDependent() {
        return false;
    }

    execute(lexer) {
        lexer.setChannel(this.channel);
    }

    /**
     * @return {number}
     */
    hashCode() {
        var hash = MurmurHash.initialize();
        hash = MurmurHash.update(hash, this.getActionType());
        hash = MurmurHash.update(hash, this.channel);
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
        else if (!(obj instanceof LexerChannelAction)) {
            return false;
        }

        return this.channel === obj.channel;
    }

    /**
     * @return {string}
     */
    toString() {
        return format("channel(%d)", this.channel);
    }
}


exports = LexerChannelAction;
