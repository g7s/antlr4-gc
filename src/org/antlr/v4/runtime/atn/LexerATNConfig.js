/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.LexerATNConfig');
goog.module.declareLegacyNamespace();


const SemanticContext = goog.require('org.antlr.v4.runtime.atn.SemanticContext');
const ATNConfig = goog.require('org.antlr.v4.runtime.atn.ATNConfig');
const LexerActionExecutor = goog.require('org.antlr.v4.runtime.atn.LexerActionExecutor');
const DecisionState = goog.require('org.antlr.v4.runtime.atn.DecisionState');
const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');

class LexerATNConfig extends ATNConfig {
    /**
     * @param {...*} args
     */
    constructor(args) {
        /**
         * @type {LexerActionExecutor}
         */
        var lexerActionExecutor = null;
        /**
         * @type {boolean}
         */
        var passedThroughNonGreedyDecision = false;

        var [a, b, c, d] = arguments;
        if (a instanceof LexerATNConfig) {
            if (c instanceof LexerActionExecutor) {
                super(a, b, a.context, a.semanticContext);
                lexerActionExecutor = c;
            } else {
                super(a, b, c, a.semanticContext);
                lexerActionExecutor = a.lexerActionExecutor;
            }
            passedThroughNonGreedyDecision = LexerATNConfig.checkNonGreedyDecision(a, b);
        } else {
            super(a, b, c, SemanticContext.NONE);
            lexerActionExecutor = d || null;
        }

        /**
         * This is the backing field for {@link #getLexerActionExecutor}.
         *
         * @private {LexerActionExecutor}
         */
        this.lexerActionExecutor = lexerActionExecutor;
        /**
         * @private {boolean}
         */
        this.passedThroughNonGreedyDecision = passedThroughNonGreedyDecision;
    }

    /**
     * Gets the {@link LexerActionExecutor} capable of executing the embedded
     * action(s) for the current configuration.
     *
     * @return {LexerActionExecutor}
     */
    getLexerActionExecutor() {
        return this.lexerActionExecutor;
    }

    /**
     * @return {boolean}
     */
    hasPassedThroughNonGreedyDecision() {
        return this.passedThroughNonGreedyDecision;
    }

    hashCode() {
        var hashCode = MurmurHash.initialize(7);
        hashCode = MurmurHash.update(hashCode, this.state.stateNumber);
        hashCode = MurmurHash.update(hashCode, this.alt);
        hashCode = MurmurHash.update(hashCode, this.context);
        hashCode = MurmurHash.update(hashCode, this.semanticContext);
        hashCode = MurmurHash.update(hashCode, this.passedThroughNonGreedyDecision ? 1 : 0);
        hashCode = MurmurHash.update(hashCode, this.lexerActionExecutor);
        hashCode = MurmurHash.finish(hashCode, 6);
        return hashCode;
    }

    equals(other) {
        if (this === other) {
            return true;
        }
        else if (!(other instanceof LexerATNConfig)) {
            return false;
        }

        if (this.passedThroughNonGreedyDecision !== other.passedThroughNonGreedyDecision) {
            return false;
        }
        var a = this.lexerActionExecutor == null ? other.lexerActionExecutor == null : this.lexerActionExecutor.equals(other.lexerActionExecutor);
        if (!a) {
            return false;
        }

        return super.equals(other);
    }
}

/**
 * @private
 * @param {LexerATNConfig} source
 * @param {org.antlr.v4.runtime.atn.ATNState} target
 * @return {boolean}
 */
LexerATNConfig.checkNonGreedyDecision = function (source, target) {
    return source.passedThroughNonGreedyDecision
        || (target instanceof DecisionState) && target.nonGreedy;
};


exports = LexerATNConfig;
