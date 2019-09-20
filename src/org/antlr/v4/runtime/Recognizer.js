/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.Recognizer');


const ConsoleErrorListener = goog.require('org.antlr.v4.runtime.ConsoleErrorListener');
const ProxyErrorListener = goog.require('org.antlr.v4.runtime.ProxyErrorListener');
const VocabularyImpl = goog.require('org.antlr.v4.runtime.VocabularyImpl');
const Token = goog.require('org.antlr.v4.runtime.Token');
const {toMap} = goog.require('org.antlr.v4.runtime.misc.Utils');
const {remove} = goog.require('goog.array');

/**
 * @abstract
 * @template Symbol, ATNInterpreter
 */
class Recognizer {
    constructor() {
        /**
         * @private
         * @type {Array<org.antlr.v4.runtime.ANTLRErrorListener>}
         */
        this._listeners = [ConsoleErrorListener.getInstance()];
        /**
         * @protected
         * @type {ATNInterpreter}
         */
        this._interp = null;
        /**
         * @private
         * @type {number}
         */
        this._stateNumber = -1;
    }

    /**
     * Used to print out token names like ID during debugging and
     * error reporting.  The generated parsers implement a method
     * that overrides this to point to their String[] tokenNames.
     *
     * @return {Array<?string>}
     * @abstract
     * @deprecated Use {@link #getVocabulary()} instead.
     */
    getTokenNames() {}

    /**
     * @return {Array<string>}
     * @abstract
     */
    getRuleNames() {}

    /**
     * Get the vocabulary used by the recognizer.
     *
     * @return {org.antlr.v4.runtime.Vocabulary} A {@link Vocabulary} instance
     * providing information about the vocabulary used by the grammar.
     *
     * @suppress {deprecated}
     */
    getVocabulary() {
        return VocabularyImpl.fromTokenNames(this.getTokenNames());
    }

    /**
     * Get a map from token names to token types.
     *
     * <p>Used for XPath and tree pattern compilation.</p>
     *
     * @return {Object<number>}
     */
    getTokenTypeMap() {
        let vocabulary = this.getVocabulary();
        let result = Recognizer.tokenTypeMapCache.get(vocabulary);
        if (!result) {
            result = {};
            for (var i = 0; i <= this.getATN().maxTokenType; i++) {
                let literalName = vocabulary.getLiteralName(i);
                if (literalName !== null) {
                    result[literalName] = i;
                }
                let symbolicName = vocabulary.getSymbolicName(i);
                if (symbolicName !== null) {
                    result[symbolicName] = i;
                }
            }
            result["EOF"] = Token.EOF;
            Recognizer.tokenTypeMapCache.set(vocabulary, result);
        }
        return result;
    }

    /**
     * Get a map from rule names to rule indexes.
     *
     * <p>Used for XPath and tree pattern compilation.</p>
     *
     * @return {Object<number>}
     */
    getRuleIndexMap() {
        let ruleNames = this.getRuleNames();
        if (ruleNames === null) {
            throw new Error("The current recognizer does not provide a list of rule names.");
        }
        /**
         * @type {Object<number>}
         */
        let result = Recognizer.ruleIndexMapCache.get(ruleNames);
        if (result === null) {
            Recognizer.ruleIndexMapCache.set(ruleNames, toMap(ruleNames));
        }
        return result;
    }

    /**
     * @param {string} tokenName
     * @return {number}
     */
    getTokenType(tokenName) {
        let ttype = this.getTokenTypeMap()[tokenName];
        if (ttype !== null) return ttype;
        return Token.INVALID_TYPE;
    }

    /**
     * If this recognizer was generated, it will have a serialized ATN
     * representation of the grammar.
     *
     * <p>For interpreters, we don't know their serialized ATN despite having
     * created the interpreter from it.</p>
     *
     * @return {string}
     * @throws {Error}
     */
    getSerializedATN() {
        throw new Error("there is no serialized ATN");
    }

    /**
     * For debugging and other purposes, might want the grammar name.
     * Have ANTLR generate an implementation for this method.
     *
     * @return {string}
     * @abstract
     */
    getGrammarFileName() {}

    /**
     * Get the {@link ATN} used by the recognizer for prediction.
     *
     * @return {org.antlr.v4.runtime.atn.ATN} The {@link ATN} used by the recognizer for prediction.
     * @abstract
     */
    getATN() {}

    /**
     * Get the ATN interpreter used by the recognizer for prediction.
     *
     * @return {ATNInterpreter} The ATN interpreter used by the recognizer for prediction.
     */
    getInterpreter() {
        return this._interp;
    }

    /** If profiling during the parse/lex, this will return DecisionInfo records
     *  for each decision in recognizer in a ParseInfo object.
     *
     * @since 4.3
     *
     * @return {org.antlr.v4.runtime.atn.ParseInfo}
     */
    getParseInfo() {
        return null;
    }

    /**
     * Set the ATN interpreter used by the recognizer for prediction.
     *
     * @param {ATNInterpreter} interpreter The ATN interpreter used by the recognizer for
     * prediction.
     * @return {void}
     */
    setInterpreter(interpreter) {
        this._interp = interpreter;
    }

    /**
     * What is the error header, normally line/character position information?
     * @param {org.antlr.v4.runtime.RecognitionException} e
     * @return {string}
     */
    getErrorHeader(e) {
        let token = e.getOffendingToken();
        let line = token.getLine();
        let charPositionInLine = token.getCharPositionInLine();
        return "line "+line+":"+charPositionInLine;
    }

    /** How should a token be displayed in an error message? The default
     *  is to display just the text, but during development you might
     *  want to have a lot of information spit out.  Override in that case
     *  to use t.toString() (which, for CommonToken, dumps everything about
     *  the token). This is better than forcing you to override a method in
     *  your token objects because you don't have to go modify your lexer
     *  so that it creates a new Java type.
     *
     * @param {Token} t
     * @return {string}
     * @deprecated This method is not called by the ANTLR 4 Runtime. Specific
     * implementations of {@link ANTLRErrorStrategy} may provide a similar
     * feature when necessary. For example, see
     * {@link DefaultErrorStrategy#getTokenErrorDisplay}.
     */
    getTokenErrorDisplay(t) {
        if (t === null) return "<no token>";
        var s = t.getText();
        if (s === null) {
            if (t.getType() === Token.EOF) {
                s = "<EOF>";
            }
            else {
                s = "<"+t.getType()+">";
            }
        }
        s = s.replace("\n","\\n");
        s = s.replace("\r","\\r");
        s = s.replace("\t","\\t");
        return "'"+s+"'";
    }

    /**
     * @param {org.antlr.v4.runtime.ANTLRErrorListener} listener
     * @return {void}
     * @throws {Error} NullPointerException if {@code listener} is {@code null}.
     */
    addErrorListener(listener) {
        if (listener === null) {
            throw new Error("listener cannot be null.");
        }
        this._listeners.push(listener);
    }

    /**
     * @param {org.antlr.v4.runtime.ANTLRErrorListener} listener
     * @return {void}
     */
    removeErrorListener(listener) {
        remove(this._listeners, listener);
    }

    removeErrorListeners() {
        this._listeners = [];
    }

    /**
     * @return {Array<org.antlr.v4.runtime.ANTLRErrorListener>}
     */
    getErrorListeners() {
        return this._listeners;
    }

    /**
     * @return {org.antlr.v4.runtime.ANTLRErrorListener}
     */
    getErrorListenerDispatch() {
        return new ProxyErrorListener(this.getErrorListeners());
    }

    /**
     * subclass needs to override these if there are sempreds or actions
     * that the ATN interp needs to execute
     *
     * @param {org.antlr.v4.runtime.RuleContext} localctx
     * @param {number} ruleIndex
     * @param {number} actionIndex
     * @return {boolean}
     */
    sempred(localctx, ruleIndex, actionIndex) {
        return true;
    }

    /**
     * @param {org.antlr.v4.runtime.RuleContext} localctx
     * @param {number} precedence
     * @return {boolean}
     */
    precpred(localctx, precedence) {
        return true;
    }

    /**
     * @param {org.antlr.v4.runtime.RuleContext} localctx
     * @param {number} ruleIndex
     * @param {number} actionIndex
     * @return {void}
     */
    action(localctx, ruleIndex, actionIndex) {}

    /**
     * @return {number}
     * @final
     */
    getState() {
        return this._stateNumber;
    }

    /**
     * Indicate that the recognizer has changed internal state that is
     * consistent with the ATN state passed in.  This way we always know
     * where we are in the ATN as the parser goes along. The rule
     * context objects form a stack that lets us see the stack of
     * invoking rules. Combine this and we have complete ATN
     * configuration information.
     *
     * @param {number} atnState
     * @return {void}
     * @final
     */
    setState(atnState) {
        this._stateNumber = atnState;
    }

    /**
     * @return {org.antlr.v4.runtime.IntStream}
     * @abstract
     */
    getInputStream() {}

    /**
     * @param {org.antlr.v4.runtime.IntStream} input
     * @return {void}
     * @abstract
     */
    setInputStream(input) {}

    /**
     * @return {org.antlr.v4.runtime.TokenFactory<?>}
     * @abstract
     */
    getTokenFactory() {}

    /**
     * @param {org.antlr.v4.runtime.TokenFactory<?>} input
     * @return {void}
     * @abstract
     */
    setTokenFactory(input) {}
};

/**
 * @type {number}
 * @final
 */
Recognizer.EOF = -1;

/**
 * @type {WeakMap<org.antlr.v4.runtime.Vocabulary, Object<number>>}
 * @private
 * @final
 */
Recognizer.tokenTypeMapCache = new WeakMap();

/**
 * @type {WeakMap<Array<string>, Object<number>>}
 * @private
 * @final
 */
Recognizer.ruleIndexMapCache = new WeakMap();


exports = Recognizer;
