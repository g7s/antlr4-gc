/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.Parser');

/**
 import org.antlr.v4.runtime.atn.ATN;
 import org.antlr.v4.runtime.atn.ATNDeserializationOptions;
 import org.antlr.v4.runtime.atn.ATNDeserializer;
 import org.antlr.v4.runtime.atn.ATNSimulator;
 import org.antlr.v4.runtime.atn.ATNState;
 import org.antlr.v4.runtime.atn.ParseInfo;
 import org.antlr.v4.runtime.atn.ParserATNSimulator;
 import org.antlr.v4.runtime.atn.PredictionMode;
 import org.antlr.v4.runtime.atn.ProfilingATNSimulator;
 import org.antlr.v4.runtime.atn.RuleTransition;
 import org.antlr.v4.runtime.dfa.DFA;
 import org.antlr.v4.runtime.misc.IntegerStack;
 import org.antlr.v4.runtime.misc.IntervalSet;
 import org.antlr.v4.runtime.tree.ErrorNode;
 import org.antlr.v4.runtime.tree.ErrorNodeImpl;
 import org.antlr.v4.runtime.tree.ParseTreeListener;
 import org.antlr.v4.runtime.tree.ParseTreeWalker;
 import org.antlr.v4.runtime.tree.TerminalNode;
 import org.antlr.v4.runtime.tree.TerminalNodeImpl;
 import org.antlr.v4.runtime.tree.pattern.ParseTreePattern;
 import org.antlr.v4.runtime.tree.pattern.ParseTreePatternMatcher;

 import java.util.ArrayList;
 import java.util.Collections;
 import java.util.List;
 import java.util.Map;
 import java.util.WeakHashMap;
 */

const Token = goog.require('org.antlr.v4.runtime.Token');
const Recognizer = goog.require('org.antlr.v4.runtime.Recognizer');
const DefaultErrorStrategy = goog.require('org.antlr.v4.runtime.DefaultErrorStrategy');
const ATN = goog.require('org.antlr.v4.runtime.atn.ATN');
const ATNDeserializationOptions = goog.require('org.antlr.v4.runtime.atn.ATNDeserializationOptions');
const ATNDeserializer = goog.require('org.antlr.v4.runtime.atn.ATNDeserializer');
const ATNSimulator = goog.require('org.antlr.v4.runtime.atn.ATNSimulator');
const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');
const ParseInfo = goog.require('org.antlr.v4.runtime.atn.ParseInfo');
const ParserATNSimulator = goog.require('org.antlr.v4.runtime.atn.ParserATNSimulator');
const PredictionMode = goog.require('org.antlr.v4.runtime.atn.PredictionMode');
const ProfilingATNSimulator = goog.require('org.antlr.v4.runtime.atn.ProfilingATNSimulator');
const RuleTransition = goog.require('org.antlr.v4.runtime.atn.RuleTransition');
const DFA = goog.require('org.antlr.v4.runtime.dfa.DFA');
const IntegerStack = goog.require('org.antlr.v4.runtime.misc.IntegerStack');
const IntervalSet = goog.require('org.antlr.v4.runtime.misc.IntervalSet');
const ErrorNode = goog.require('org.antlr.v4.runtime.tree.ErrorNode');
const ErrorNodeImpl = goog.require('org.antlr.v4.runtime.tree.ErrorNodeImpl');
const ParseTreeListener = goog.require('org.antlr.v4.runtime.tree.ParseTreeListener');
const ParseTreeWalker = goog.require('org.antlr.v4.runtime.tree.ParseTreeWalker');
const TerminalNode = goog.require('org.antlr.v4.runtime.tree.TerminalNode');
const TerminalNodeImpl = goog.require('org.antlr.v4.runtime.tree.TerminalNodeImpl');
const ParseTreePattern = goog.require('org.antlr.v4.runtime.tree.pattern.ParseTreePattern');
const ParseTreePatternMatcher = goog.require('org.antlr.v4.runtime.tree.pattern.ParseTreePatternMatcher');


class TraceListener extends ParseTreeListener {
    /**
     * @param {Parser} parser
     */
    constructor(parser) {
        this._parser = parser;
    }

    enterEveryRule(ctx) {
        console.log("enter   " + this._parser.getRuleNames()[ctx.getRuleIndex()] +
                           ", LT(1)=" + this._parser._input.LT(1).getText());
    }

    visitTerminal(node) {
        console.log("consume " + node.getSymbol() + " rule " +
                           this._parser.getRuleNames()[this._parser._ctx.getRuleIndex()]);
    }

    visitErrorNode(node) {}

    exitEveryRule(ctx) {
        console.log("exit    " + this._parser.getRuleNames()[ctx.getRuleIndex()] +
                           ", LT(1)=" + this._parser._input.LT(1).getText());
    }
};


/**
 * @abstract
 * @extends org.antlr.v4.runtime.Recognizer<org.antlr.v4.runtime.Token, org.antlr.v4.runtime.atn.ParserATNSimulator>
 */
class Parser extends Recognizer {
    /**
     * @param {org.antlr.v4.runtime.TokenStream} input
     */
    constructor(input) {
        /**
         * This field maps from the serialized ATN string to the deserialized {@link ATN} with
         * bypass alternatives.
         *
         * @private {WeakMap.<string, ATN>}
         * @see ATNDeserializationOptions#isGenerateRuleBypassTransitions()
         */
        this.bypassAltsAtnCache = new WeakMap();
        /**
         * The error handling strategy for the parser. The default value is a new
         * instance of {@link DefaultErrorStrategy}.
         *
         * @protected {org.antlr.v4.runtime.ANTLRErrorStrategy}
         * @see #getErrorHandler
         * @see #setErrorHandler
         */
        this._errHandler = new DefaultErrorStrategy();
        /**
         * The input stream.
         *
         * @protected {org.antlr.v4.runtime.TokenStream}
         * @see #getInputStream
         * @see #setInputStream
         */
        this._input = null;
        /**
         * @protected {Array.<number>}
         */
        this._precedenceStack = [0];
        /**
         * The {@link ParserRuleContext} object for the currently executing rule.
         * This is always non-null during the parsing process.
         *
         * @protected {org.antlr.v4.runtime.ParserRuleContext}
         */
        this._ctx = null;
        /**
         * Specifies whether or not the parser should construct a parse tree during
         * the parsing process. The default value is {@code true}.
         *
         * @protected {boolean}
         * @see #getBuildParseTree
         * @see #setBuildParseTree
         */
        this._buildParseTrees = true;
        /**
         * When {@link #setTrace}{@code (true)} is called, a reference to the
         * {@link TraceListener} is stored here so it can be easily removed in a
         * later call to {@link #setTrace}{@code (false)}. The listener itself is
         * implemented as a parser listener so this field is not directly used by
         * other parser methods.
         *
         * @private {TraceListener}
         */
        this._tracer = null;
        /**
         * The list of {@link ParseTreeListener} listeners registered to receive
         * events during the parse.
         *
         * @protected {Array.<ParseTreeListener>}
         * @see #addParseListener
         */
        this._parseListeners = [];
        /**
         * The number of syntax errors reported during parsing. This value is
         * incremented each time {@link #notifyErrorListeners} is called.
         *
         * @protected {number}
         */
        this._syntaxErrors = 0;
        /**
         * Indicates parser has match()ed EOF token. See {@link #exitRule()}.
         *
         * @protected {boolean}
         */
        this.matchedEOF = false;

        this.setInputStream(input);
    }

    /**
     * reset the parser's state
     * @return {void}
     */
    reset() {
        if (this.getInputStream() !== null) {
            this.getInputStream().seek(0);
        }
        this._errHandler.reset(this);
        this._ctx = null;
        this._syntaxErrors = 0;
        this.setTrace(false);
        this._precedenceStack = [0];
        if (this._interp !== null) {
            this._interp.reset();
        }
    }

    /**
	 * Match current input symbol against {@code ttype}. If the symbol type
	 * matches, {@link ANTLRErrorStrategy#reportMatch} and {@link #consume} are
	 * called to complete the match process.
	 *
	 * <p>If the symbol type does not match,
	 * {@link ANTLRErrorStrategy#recoverInline} is called on the current error
	 * strategy to attempt recovery. If {@link #getBuildParseTree} is
	 * {@code true} and the token index of the symbol returned by
	 * {@link ANTLRErrorStrategy#recoverInline} is -1, the symbol is added to
	 * the parse tree by calling {@link #createErrorNode(ParserRuleContext, Token)} then
	 * {@link ParserRuleContext#addErrorNode(ErrorNode)}.</p>
	 *
	 * @param {number} ttype the token type to match
	 * @return {Token} the matched symbol
	 * @throws {Error} RecognitionException if the current input symbol did not match
	 * {@code ttype} and the error strategy could not recover from the
	 * mismatched symbol
	 */
    match(ttype) {
        var t = this.getCurrentToken();
        if (t.getType() === ttype) {
            if (ttype === Token.EOF) {
                this.matchedEOF = true;
            }
            this._errHandler.reportMatch(this);
            this.consume();
        } else {
            t = this._errHandler.recoverInline(this);
            if (this._buildParseTrees && t.getTokenIndex() === -1) {
                // we must have conjured up a new token during single token insertion
                // if it's not the current symbol
                this._ctx.addErrorNode(this.createErrorNode(this._ctx, t));
            }
        }
        return t;
    }

    /**
	 * Match current input symbol as a wildcard. If the symbol type matches
	 * (i.e. has a value greater than 0), {@link ANTLRErrorStrategy#reportMatch}
	 * and {@link #consume} are called to complete the match process.
	 *
	 * <p>If the symbol type does not match,
	 * {@link ANTLRErrorStrategy#recoverInline} is called on the current error
	 * strategy to attempt recovery. If {@link #getBuildParseTree} is
	 * {@code true} and the token index of the symbol returned by
	 * {@link ANTLRErrorStrategy#recoverInline} is -1, the symbol is added to
	 * the parse tree by calling {@link Parser#createErrorNode(ParserRuleContext, Token)}. then
     * {@link ParserRuleContext#addErrorNode(ErrorNode)}</p>
	 *
	 * @return {Token} the matched symbol
	 * @throws {Error} RecognitionException if the current input symbol did not match
	 * a wildcard and the error strategy could not recover from the mismatched
	 * symbol
	 */
    matchWildcard() {
        var t = this.getCurrentToken();
        if (t.getType() > 0) {
            this._errHandler.reportMatch(this);
            this.consume();
        } else {
            t = this._errHandler.recoverInline(this);
            if (this._buildParseTrees && t.tokenIndex === -1) {
                // we must have conjured up a new token during single token insertion
                // if it's not the current symbol
                this._ctx.addErrorNode(this.createErrorNode(this._ctx, t));
            }
        }
        return t;
    }

    /**
	 * Track the {@link ParserRuleContext} objects during the parse and hook
	 * them up using the {@link ParserRuleContext#children} list so that it
	 * forms a parse tree. The {@link ParserRuleContext} returned from the start
	 * rule represents the root of the parse tree.
	 *
	 * <p>Note that if we are not building parse trees, rule contexts only point
	 * upwards. When a rule exits, it returns the context but that gets garbage
	 * collected if nobody holds a reference. It points upwards but nobody
	 * points at it.</p>
	 *
	 * <p>When we build parse trees, we are adding all of these contexts to
	 * {@link ParserRuleContext#children} list. Contexts are then not candidates
	 * for garbage collection.</p>
     *
     * @param {boolean} buildParseTrees
     * @return {void}
	 */
    setBuildParseTree(buildParseTrees) {
        this._buildParseTrees = buildParseTrees;
    }

    /**
     * Gets whether or not a complete parse tree will be constructed while
     * parsing. This property is {@code true} for a newly constructed parser.
     *
     * @return {boolean} whether a complete parse tree will be constructed while
     * parsing
     */
    getBuildParseTree() {
        return this._buildParseTrees;
    }

    /**
     * Trim the internal lists of the parse tree during parsing to conserve memory.
     * This property is set to {@code false} by default for a newly constructed parser.
     *
     * @param {boolean} trimParseTrees {@code true} to trim the capacity of the
     * {@link ParserRuleContext#children} list to its size after a rule is parsed.
     * @return {void}
     */
    setTrimParseTree(trimParseTrees) {
        // NOT IMPLEMENTED
    }

    /**
     * @return {boolean} whether the {@link ParserRuleContext#children} list is trimmed
     * using the default {@link Parser.TrimToSizeListener} during the parse process.
     */
    getTrimParseTree() {
        return false;
    }

    /**
     * @return {Array.<ParseTreeListener>}
     */
    getParseListeners() {
        return this._parseListeners || [];
    }

    /**
	 * Registers {@code listener} to receive events during the parsing process.
	 *
	 * <p>To support output-preserving grammar transformations (including but not
	 * limited to left-recursion removal, automated left-factoring, and
	 * optimized code generation), calls to listener methods during the parse
	 * may differ substantially from calls made by
	 * {@link ParseTreeWalker#DEFAULT} used after the parse is complete. In
	 * particular, rule entry and exit events may occur in a different order
	 * during the parse than after the parser. In addition, calls to certain
	 * rule entry methods may be omitted.</p>
	 *
	 * <p>With the following specific exceptions, calls to listener events are
	 * <em>deterministic</em>, i.e. for identical input the calls to listener
	 * methods will be the same.</p>
	 *
	 * <ul>
	 * <li>Alterations to the grammar used to generate code may change the
	 * behavior of the listener calls.</li>
	 * <li>Alterations to the command line options passed to ANTLR 4 when
	 * generating the parser may change the behavior of the listener calls.</li>
	 * <li>Changing the version of the ANTLR Tool used to generate the parser
	 * may change the behavior of the listener calls.</li>
	 * </ul>
	 *
	 * @param {ParseTreeListener} listener the listener to add
	 * @return {void}
	 * @throws {Error} NullPointerException if {@code} listener is {@code null}
	 */
    addParseListener(listener) {
        if (listener === null) {
            throw new Error("listener");
        }
        if (this._parseListeners === null) {
            this._parseListeners = [];
        }
        this._parseListeners.push(listener);
    }

    /**
     * Remove {@code listener} from the list of parse listeners.
     *
     * <p>If {@code listener} is {@code null} or has not been added as a parse
     * listener, this method does nothing.</p>
     *
     * @see #addParseListener
     *
     * @param {ParseTreeListener} listener the listener to remove
     * @return {void}
     */
    removeParseListener(listener) {
        if (this._parseListeners !== null) {
            /**
             * @type {number}
             */
            var idx = this._parseListeners.indexOf(listener);
            if (idx >= 0) {
                this._parseListeners.splice(idx, 1);
            }
            if (this._parseListeners.length === 0) {
                this._parseListeners = null;
            }
        }
    }

    /**
     * Remove all parse listeners.
     *
     * @see #addParseListener
     *
     * @return {void}
     */
    removeParseListeners() {
        this._parseListeners = null;
    }

    /**
     * Notify any parse listeners of an enter rule event.
     *
     * @see #addParseListener
     *
     * @protected
     * @return {void}
     */
    triggerEnterRuleEvent() {
        (this._parseListeners || []).forEach((listener) => {
            listener.enterEveryRule(this._ctx);
            this._ctx.enterRule(listener);
        }, this);
    }

    /**
     * Notify any parse listeners of an exit rule event.
     *
     * @see #addParseListener
     *
     * @protected
     * @return {void}
     */
    triggerExitRuleEvent() {
        // reverse order walk of listeners
        (this._parseListeners || []).slice(0).reverse().forEach((listener) => {
            this._ctx.exitRule(listener);
            listener.exitEveryRule(this._ctx);
        });
    }

    /**
     * Gets the number of syntax errors reported during parsing. This value is
     * incremented each time {@link #notifyErrorListeners} is called.
     *
     * @see #notifyErrorListeners
     *
     * @return {number}
     */
    getNumberOfSyntaxErrors() {
        return this._syntaxErrors;
    }

    getTokenFactory() {
        return this._input.getTokenSource().getTokenFactory();
    }

    setTokenFactory(factory) {
        this._input.getTokenSource().setTokenFactory(factory);
    }

    /**
	 * The ATN with bypass alternatives is expensive to create so we create it
	 * lazily.
	 *
     * @return {ATN}
	 * @throws {Error} UnsupportedOperationException if the current parser does not
	 * implement the {@link #getSerializedATN()} method.
	 */
    getATNWithBypassAlts() {
        var serializedAtn = this.getSerializedATN();
        if (serializedAtn === null) {
            throw new Error("The current parser does not support an ATN with bypass alternatives.");
        }
        var result = this.bypassAltsAtnCache[serializedAtn];
        if (result == null) { // may be also undefined and undefined == null
            var deserializationOptions = new ATNDeserializationOptions();
            deserializationOptions.setGenerateRuleBypassTransitions(true);
            result = new ATNDeserializer(deserializationOptions).deserialize(serializedAtn);
            this.bypassAltsAtnCache[serializedAtn] = result;
        }
        return result;
    }

    /**
	 * The preferred method of getting a tree pattern. For example, here's a
	 * sample use:
	 *
	 * <pre>
	 * ParseTree t = parser.expr();
	 * ParseTreePattern p = parser.compileParseTreePattern("&lt;ID&gt;+0", MyParser.RULE_expr);
	 * ParseTreeMatch m = p.match(t);
	 * String id = m.get("ID");
	 * </pre>
     *
     * @param {string} pattern
     * @param {number} patternRuleIndex
     * @param {Lexer=} lexer
     * @return {ParseTreePattern}
	 */
    compileParseTreePattern(pattern, patternRuleIndex, lexer) {
        if (lexer == null) {
            if (this.getTokenStream() !== null) {
                var tokenSource = this.getTokenStream().getTokenSource();
                if (tokenSource instanceof Lexer) {
                    lexer = tokenSource;
                }
            }
        }
        if (lexer == null) {
            throw new Error("Parser can't discover a lexer to use");
        }
        var m = new ParseTreePatternMatcher(lexer, this);
        return m.compile(pattern, patternRuleIndex);
    }

    /**
     * @return {org.antlr.v4.runtime.ANTLRErrorStrategy}
     */
    getErrorHandler() {
        return this._errHandler;
    }

    /**
     * @param {org.antlr.v4.runtime.ANTLRErrorStrategy} handler
     * @return {void}
     */
    setErrorHandler(handler) {
        this._errHandler = handler;
    }

    getInputStream() {
        return this.getTokenStream();
    }

    /**
     * @return {org.antlr.v4.runtime.TokenStream}
     */
    getTokenStream() {
        return this._input;
    }

    /**
     * Set the token stream and reset the parser.
     *
     * @param {org.antlr.v4.runtime.TokenStream} input
     * @return {void}
     */
    setTokenStream(input) {
        this._input = null;
        this.reset();
        this._input = input;
    }

    /**
     * Match needs to return the current input symbol, which gets put
     * into the label for the associated token ref; e.g., x=ID.
     */

    /**
     * @return {Token}
     */
    getCurrentToken() {
        return this._input.LT(1);
    }

    /**
     * @param {string} msg
     * @param {Token} offendingToken
     * @param {Error} e
     * @return {void}
     */
    notifyErrorListeners(msg, offendingToken, e) {
        if (offendingToken == null) {
            offendingToken = this.getCurrentToken();
        }
        this._syntaxErrors += 1;
        var line = offendingToken.line;
        var column = offendingToken.column;
        var listener = this.getErrorListenerDispatch();
        listener.syntaxError(this, offendingToken, line, column, msg, e);
    }

    /**
	 * Consume and return the {@linkplain #getCurrentToken current symbol}.
	 *
	 * <p>E.g., given the following input with {@code A} being the current
	 * lookahead symbol, this function moves the cursor to {@code B} and returns
	 * {@code A}.</p>
	 *
	 * <pre>
	 *  A B
	 *  ^
	 * </pre>
	 *
	 * If the parser is not in error recovery mode, the consumed symbol is added
	 * to the parse tree using {@link ParserRuleContext#addChild(TerminalNode)}, and
	 * {@link ParseTreeListener#visitTerminal} is called on any parse listeners.
	 * If the parser <em>is</em> in error recovery mode, the consumed symbol is
	 * added to the parse tree using {@link #createErrorNode(ParserRuleContext, Token)} then
     * {@link ParserRuleContext#addErrorNode(ErrorNode)} and
	 * {@link ParseTreeListener#visitErrorNode} is called on any parse
	 * listeners.
     *
     * @return {Token}
	 */
    consume() {
        var o = this.getCurrentToken();
        if (o.type !== Token.EOF) {
            this.getInputStream().consume();
        }
        var hasListener = this._parseListeners !== null && this._parseListeners.length > 0;
        if (this._buildParseTrees || hasListener) {
            if (this._errHandler.inErrorRecoveryMode(this)) {
                /**
                 * @type {ErrorNode}
                 */
                var node = this._ctx.addErrorNode(this.createErrorNode(this._ctx, o));
                (this._parseListeners || []).forEach((listener) => {
                    listener.visitErrorNode(node);
                });
            } else {
                /**
                 * @type {TerminalNode}
                 */
                var node = this._ctx.addChild(this.createTerminalNode(this._ctx, o));
                (this._parseListeners || []).forEach((listener) => {
                    listener.visitTerminal(node);
                });
            }
        }
        return o;
    }

    /** How to create a token leaf node associated with a parent.
     *  Typically, the terminal node to create is not a function of the parent.
     *
     * @since 4.7
     *
     * @param {org.antlr.v4.runtime.ParserRuleContext} parent
     * @param {Token} t
     * @return {TerminalNode}
     */
    createTerminalNode(parent, t) {
        return new TerminalNodeImpl(t);
    }

    /** How to create an error node, given a token, associated with a parent.
     *  Typically, the error node to create is not a function of the parent.
     *
     * @since 4.7
     *
     * @param {org.antlr.v4.runtime.ParserRuleContext} parent
     * @param {Token} t
     * @return {ErrorNode}
     */
    createErrorNode(parent, t) {
        return new ErrorNodeImpl(t);
    }

    /**
     * @protected
     * @return {void}
     */
    addContextToParseTree() {
		parent = this._ctx.parent;
		// add current context to parent if we have a parent
		if (parent != null)	{
			parent.addChild(this._ctx);
		}
    }

    /**
     * Always called by generated parsers upon entry to a rule. Access field
     * {@link #_ctx} get the current context.
     *
     * @param {org.antlr.v4.runtime.ParserRuleContext} localctx
     * @param {number} state
     * @param {number} ruleIndex
     * @return {void}
     */
    enterRule(localctx, state, ruleIndex) {
        this.setState(state);
        this._ctx = localctx;
        this._ctx.start = this._input.LT(1);
        if (this._buildParseTrees) {
            this.addContextToParseTree();
        }
        if (this._parseListeners !== null) {
            this.triggerEnterRuleEvent();
        }
    }

    /**
     * @return {void}
     */
    exitRule() {
        this._ctx.stop = this._input.LT(-1);
        // trigger event on _ctx, before it reverts to parent
        if (this._parseListeners !== null) {
            this.triggerExitRuleEvent();
        }
        this.setState(this._ctx.invokingState);
        this._ctx = this._ctx.parent;
    }
};


exports = Parser;
