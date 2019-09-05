/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LexerActionType');

/**
 * Represents the serialization type of a {@link LexerAction}.
 *
 * @author Sam Harwell
 * @since 4.2
 */

/**
 * The type of a {@link LexerChannelAction} action.
 *
 * @type {number}
 */
LexerActionType.CHANNEL = 1;
/**
 * The type of a {@link LexerCustomAction} action.
 *
 * @type {number}
 */
LexerActionType.CUSTOM = 2;
/**
 * The type of a {@link LexerModeAction} action.
 *
 * @type {number}
 */
LexerActionType.MODE = 3;
/**
 * The type of a {@link LexerMoreAction} action.
 *
 * @type {number}
 */
LexerActionType.MORE = 4;
/**
 * The type of a {@link LexerPopModeAction} action.
 *
 * @type {number}
 */
LexerActionType.POP_MODE = 5;
/**
 * The type of a {@link LexerPushModeAction} action.
 *
 * @type {number}
 */
LexerActionType.PUSH_MODE = 6;
/**
 * The type of a {@link LexerSkipAction} action.
 *
 * @type {number}
 */
LexerActionType.SKIP = 7;
/**
 * The type of a {@link LexerTypeAction} action.
 *
 * @type {number}
 */
LexerActionType.TYPE = 8;


exports = LexerActionType;
