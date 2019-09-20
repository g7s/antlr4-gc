/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.tree.TerminalNodeImpl');


const TerminalNode = goog.require('org.antlr.v4.runtime.tree.TerminalNode');
const Token = goog.require('org.antlr.v4.runtime.Token');
const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');

/**
 * @implements {TerminalNode}
 */
class TerminalNodeImpl {
    /**
     * @param {Token} symbol
     */
	constructor(symbol) {
        /**
         * @type {Token}
         */
        this.symbol = symbol;
        /**
         * @type {org.antlr.v4.runtime.tree.ParseTree}
         */
        this.parent = null;
    }

	getChild(i) {
        return null;
    }

	getSymbol() {
        return this.symbol;
    }

	getParent() {
        return this.parent;
    }

	setParent(parent) {
		this.parent = parent;
	}

	getPayload() {
        return this.symbol;
    }

	getSourceInterval() {
		if (this.symbol == null) return Interval.INVALID;
		var tokenIndex = this.symbol.getTokenIndex();
		return new Interval(tokenIndex, tokenIndex);
	}

	getChildCount() {
        return 0;
    }

	accept(visitor) {
		return visitor.visitTerminal(this);
	}

	getText() {
        return this.symbol.getText() || "";
    }

	toStringTree(parser) {
		return this.toString();
	}

	toString() {
        if (this.symbol.getType() === Token.EOF) return "<EOF>";
        return this.getText();
	}
}


exports = TerminalNodeImpl;
