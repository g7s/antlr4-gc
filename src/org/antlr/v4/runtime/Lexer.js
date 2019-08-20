/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.Lexer');


const Recognizer = goog.require('org.antlr.v4.runtime.Recognizer');
const Token = goog.require('org.antlr.v4.runtime.Token');
const IntStream = goog.require('org.antlr.v4.runtime.IntStream');
const LexerNoViableAltException = goog.require('org.antlr.v4.runtime.LexerNoViableAltException');
const CommonTokenFactory = goog.require('org.antlr.v4.runtime.CommonTokenFactory');
const LexerATNSimulator = goog.require('org.antlr.v4.runtime.atn.LexerATNSimulator');
const IntegerStack = goog.require('org.antlr.v4.runtime.misc.IntegerStack');
const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');
const Pair = goog.require('org.antlr.v4.runtime.misc.Pair');

/**
 * A lexer is recognizer that draws input symbols from a character stream.
 * lexer grammars result in a subclass of this object. A Lexer object
 * uses simplified match() and error recovery mechanisms in the interest
 * of speed.
 * @abstract
 * @extends org.antlr.v4.runtime.Recognizer<number, org.antlr.v4.runtime.atn.LexerATNSimulator>
 * @implements {org.antlr.v4.runtime.TokenSource}
 */
class Lexer extends Recognizer {
    /**
     * @param {org.antlr.v4.runtime.CharStream} input
     */
    constructor(input) {
        /**
         * @type {org.antlr.v4.runtime.CharStream}
         */
        this._input = input;
        /**
         * @protected {Pair<org.antlr.v4.runtime.TokenSource, org.antlr.v4.runtime.CharStream>}
         */
        this._tokenFactorySourcePair = new Pair(this, input);
        /**
         * How to create token objects
         * @protected {org.antlr.v4.runtime.TokenFactory<?>}
         */
        this._factory = CommonTokenFactory.DEFAULT;
        /**
         * The goal of all lexer rules/methods is to create a token object.
         * This is an instance variable as multiple rules may collaborate to
         * create a single token.  nextToken will return this object after
         * matching lexer rule(s).  If you subclass to allow multiple token
         * emissions, then set this to the last token to be matched or
         * something nonnull so that the auto token emit mechanism will not
         * emit another token.
         *
         * @type {org.antlr.v4.runtime.Token}
         */
        this._token = null;
        /**
         * What character index in the stream did the current token start at?
         * Needed, for example, to get the text for current token.  Set at
         * the start of nextToken.
         *
         * @type {number}
         */
        this._tokenStartCharIndex = -1;
        /**
         * The line on which the first character of the token resides
         *
         * @type {number}
         */
        this._tokenStartLine = -1;
        /**
         * The character position of first character within the line
         *
         * @type {number}
         */
        this._tokenStartCharPositionInLine = -1;
        /**
         * Once we see EOF on char stream, next token will be EOF.
         * If you have DONE : EOF ; then you see DONE EOF.
         *
         * @type {boolean}
         */
        this._hitEOF = false;
        /**
         * The channel number for the current token
         *
         * @type {number}
         */
        this._channel = 0;
        /**
         * The token type for the current token
         *
         * @type {number}
         */
        this._type = Token.INVALID_TYPE;
        /**
         * @type {Array.<number>}
         */
        this._modeStack = [];
        /**
         * @type {number}
         */
        this._mode = Lexer.DEFAULT_MODE;
        /**
         * You can set the text for the current token to override what is in
         * the input char buffer.  Use setText() or can set this instance var.
         *
         * @type {string}
         */
        this._text = "";
    }

    /**
     * @return {void}
     */
    reset() {
        // wack Lexer state variables
        if (this._input != null) {
            this._input.seek(0); // rewind the input
        }
        this._token = null;
        this._type = Token.INVALID_TYPE;
        this._channel = Token.DEFAULT_CHANNEL;
        this._tokenStartCharIndex = -1;
        this._tokenStartCharPositionInLine = -1;
        this._tokenStartLine = -1;
        this._text = null;

        this._hitEOF = false;
        this._mode = Lexer.DEFAULT_MODE;
        this._modeStack = [];

        this.getInterpreter().reset();
    }

    nextToken() {
		if (this._input == null) {
			throw new Error("nextToken requires a non-null input stream.");
		}

		// Mark start location in char stream so unbuffered streams are
		// guaranteed at least have text of current token
		var tokenStartMarker = this._input.mark();
		try {
			outer:
			while (true) {
				if (this._hitEOF) {
					this.emitEOF();
					return this._token;
				}

				this._token = null;
				this._channel = Token.DEFAULT_CHANNEL;
				this._tokenStartCharIndex = this._input.index();
				this._tokenStartCharPositionInLine = this.getInterpreter().getCharPositionInLine();
				this._tokenStartLine = this.getInterpreter().getLine();
				this._text = null;
				do {
					this._type = Token.INVALID_TYPE;
					var ttype;
					try {
						ttype = this.getInterpreter().match(this._input, this._mode);
					}
					catch (e) {
                        if (e instanceof LexerNoViableAltException) {
                            this.notifyListeners(e);		// report error
                            this.recover(e);
                            ttype = Lexer.SKIP;
                        } else {
                            throw e;
                        }
					}
					if (this._input.LA(1) === IntStream.EOF) {
						this._hitEOF = true;
					}
					if (this._type === Token.INVALID_TYPE) this._type = ttype;
					if (this._type === Lexer.SKIP) {
						continue outer;
					}
				} while (this._type === Lexer.MORE);
				if (this._token == null) this.emit();
				return this._token;
			}
		}
		finally {
			// make sure we release marker after match or
			// unbuffered char stream will keep buffering
			this._input.release(tokenStartMarker);
		}
    }

    /**
     * Instruct the lexer to skip creating a token for current lexer rule
     * and look for another token.  nextToken() knows to keep looking when
     * a lexer rule finishes with token set to SKIP_TOKEN.  Recall that
     * if token==null at end of any token rule, it creates one for you
     * and emits it.
     *
     * @return {void}
     */
    skip() {
        this._type = Lexer.SKIP;
    }

    /**
     * @param {number} m
     * @return {void}
     */
    mode(m) {
        this._mode = m;
    }

    /**
     * @param {number} m
     * @return {void}
     */
    pushMode(m) {
        if (LexerATNSimulator.debug) console.log("pushMode " + m);
        this._modeStack.push(this._mode);
        this.mode(m);
    }

    /**
     * @return {number}
     */
    popMode() {
        if (this._modeStack.length === 0) throw new Error();
        if (LexerATNSimulator.debug) console.log("popMode back to " + this._modeStack[this._modeStack.length - 1]);
        this.mode(this._modeStack.pop());
        return this._mode;
    }

    setTokenFactory(factory) {
        this._factory = factory;
    }

    getTokenFactory() {
        return this._factory;
    }

    setInputStream(input) {
        this._input = null;
        this._tokenFactorySourcePair = new Pair(this, this._input);
        this.reset();
        this._input = input;
        this._tokenFactorySourcePair = new Pair(this, this._input);
    }

    getSourceName() {
        return this._input.getSourceName();
    }

    getInputStream() {
        return this._input;
    }

    /**
     * By default does not support multiple emits per nextToken invocation
     * for efficiency reasons.  Subclass and override this method, nextToken,
     * and getToken (to push tokens into a list and pull from that list
     * rather than a single variable as this implementation does).
     *
     * @param {Token} token
     * @return {void}
     */
    emit(token) {
        //System.err.println("emit "+token);
        this._token = token || this._factory.create(this._tokenFactorySourcePair,
                                                    this._type,
                                                    this._text,
                                                    this._channel,
                                                    this._tokenStartCharIndex,
                                                    this.getCharIndex()-1,
                                                    this._tokenStartLine,
                                                    this._tokenStartCharPositionInLine);
    }

    /**
     * @return {Token}
     */
    emitEOF() {
        var cpos = this.getCharPositionInLine();
        var line = this.getLine();
        var eof = this._factory.create(
            this._tokenFactorySourcePair,
            Token.EOF,
            null,
            Token.DEFAULT_CHANNEL,
            this._input.index(),
            this._input.index()-1,
            line,
            cpos);
        emit(eof);
        return eof;
    }

    getLine() {
        return this.getInterpreter().getLine();
    }

    getCharPositionInLine() {
        return this.getInterpreter().getCharPositionInLine();
    }

    /**
     * @param {number} line
     * @return {void}
     */
    setLine(line) {
        this.getInterpreter().setLine(line);
    }

    /**
     * @param {number} charPositionInLine
     * @return {void}
     */
    setCharPositionInLine(charPositionInLine) {
        this.getInterpreter().setCharPositionInLine(charPositionInLine);
    }

    /**
     * What is the index of the current character of lookahead?
     *
     * @return {number}
     */
    getCharIndex() {
        return this._input.index();
    }

    /**
     * Return the text matched so far for the current token or any
     * text override.
     *
     * @return {string}
     */
    getText() {
        if (this._text != null) {
            return this._text;
        }
        return this.getInterpreter().getText(this._input);
    }

    /**
     * Set the complete text of this token; it wipes any previous
     * changes to the text.
     *
     * @param {string} text
     * @return {void}
     */
    setText(text) {
        this._text = text;
    }

    /**
     * Override if emitting multiple tokens.
     *
     * @return {Token}
     */
    getToken() {
        return this._token;
    }

    /**
     * @param {Token} _token
     * @return {void}
     */
    setToken(_token) {
        this._token = _token;
    }

    /**
     * @param {number} ttype
     * @return {void}
     */
    setType(ttype) {
        this._type = ttype;
    }

    /**
     * @return {number}
     */
    getType() {
        return this._type;
    }

    /**
     * @param {number} channel
     * @return {void}
     */
    setChannel(channel) {
        this._channel = channel;
    }

    /**
     * @return {number}
     */
    getChannel() {
        return this._channel;
    }

    /**
     * @return {Array.<string>}
     */
    getChannelNames() {
        return null;
    }

    /**
     * @return {Array.<string>}
     */
    getModeNames() {
        return null;
    }

    /**
     * Used to print out token names like ID during debugging and
     * error reporting.  The generated parsers implement a method
     * that overrides this to point to their String[] tokenNames.
     * @override
     * @deprecated
     * @return {Array.<string>}
     */
    getTokenNames() {
        return null;
    }

    /**
     * Return a list of all Token objects in input char stream.
     * Forces load of all tokens. Does not include EOF token.
     *
     * @return {Array.<Token>}
     */
    getAllTokens() {
        var tokens = [];
        var t = this.nextToken();
        while (t.getType() !== Token.EOF) {
            tokens.push(t);
            t = this.nextToken();
        }
        return tokens;
    }

    /**
     * @param {LexerNoViableAltException} e
     * @return {void}
     */
    recover(e) {
        if (this._input.LA(1) !== IntStream.EOF) {
            // skip a char and try again
            this.getInterpreter().consume(this._input);
        }
    }

    /**
     * @param {LexerNoViableAltException} e
     * @return {void}
     */
    notifyListeners(e) {
        var text = this._input.getText(Interval.of(this._tokenStartCharIndex, this._input.index()));
        var msg = "token recognition error at: '"+ this.getErrorDisplay(text) + "'";

        listener = this.getErrorListenerDispatch();
        listener.syntaxError(this, null, this._tokenStartLine, this._tokenStartCharPositionInLine, msg, e);
    }

    /**
     * @param {string} c
     * @return {string}
     */
    getErrorDisplayForChar(c) {
        if (c.charCodeAt(0) === Token.EOF) {
            return "<EOF>";
        } else if (c === '\n') {
            return "\\n";
        } else if (c === '\t') {
            return "\\t";
        } else if (c === '\r') {
            return "\\r";
        } else {
            return c;
        }
    }

    /**
     * @param {string} s
     * @return {string}
     */
    getErrorDisplay(s) {
        var d = [];
        for (var i = 0; i < s.length; i++) {
            d.push(this.getErrorDisplayForChar(s[i]));
        }
        return d.join('');
    }

    /**
     * @param {string} c
     * @return {string}
     */
    getCharErrorDisplay(c) {
        return "'" + this.getErrorDisplayForChar(c) + "'";
    }

    /**
     * Lexers can normally match any char in it's vocabulary after matching
     * a token, so do the easy thing and just kill a character and hope
     * it all works out.  You can instead use the rule invocation stack
     * to do sophisticated error recovery if you are in a fragment rule.
     *
     * @param {org.antlr.v4.runtime.RecognitionException} re
     * @return {void}
     */
    recover(re) {
        //System.out.println("consuming char "+(char)input.LA(1)+" during recovery");
        //re.printStackTrace();
        // TODO: Do we lose character or line position information?
        this._input.consume();
    }
};


/**
 * @type {number}
 * @final
 */
Lexer.DEFAULT_MODE = 0;
/**
 * @type {number}
 * @final
 */
Lexer.MORE = -2;
/**
 * @type {number}
 * @final
 */
Lexer.SKIP = -3;

/**
 * @type {number}
 * @final
 */
Lexer.DEFAULT_TOKEN_CHANNEL = Token.DEFAULT_CHANNEL;
/**
 * @type {number}
 * @final
 */
Lexer.HIDDEN = Token.HIDDEN_CHANNEL;
/**
 * @type {number}
 * @final
 */
Lexer.MIN_CHAR_VALUE = 0x0000;
/**
 * @type {number}
 * @final
 */
Lexer.MAX_CHAR_VALUE = 0x10FFFF;


exports = Lexer;
