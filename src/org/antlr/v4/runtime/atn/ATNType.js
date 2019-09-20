/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.ATNType');


/**
 * Represents the type of recognizer an ATN applies to.
 *
 * @type {!Object<number>}
 *
 * @author Sam Harwell
 */
let ATNType = {};

/**
 * A lexer grammar.
 * @type {number}
 */
ATNType.LEXER = 0;

/**
 * A parser grammar.
 * @type {number}
 */
ATNType.PARSER = 1;


exports = ATNType;
