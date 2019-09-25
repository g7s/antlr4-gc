/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.PredictionContextCache');
goog.module.declareLegacyNamespace();


const PredictionContext = goog.require('org.antlr.v4.runtime.atn.PredictionContext');
const Map = goog.require('org.antlr.v4.runtime.misc.Map');

/**
 * Used to cache {@link PredictionContext} objects. Its used for the shared
 * context cash associated with contexts in DFA states. This cache
 * can be used for both lexers and parsers.
 */
class PredictionContextCache {
    constructor() {
        /**
         * @protected {Map<PredictionContext, PredictionContext>}
         */
        this.cache = new Map();
    }

    /**
     * Add a context to the cache and return it. If the context already exists,
     * return that one instead and do not add a new context to the cache.
     * Protect shared cache from unsafe thread access.
     *
     * @param {PredictionContext} ctx
     * @return {PredictionContext}
     */
    add(ctx) {
        if (ctx === PredictionContext.EMPTY) return PredictionContext.EMPTY;
        var existing = this.cache.get(ctx);
        if (existing != null) {
            return existing;
        }
        this.cache.put(ctx, ctx);
        return ctx;
    }

    /**
     * @param {PredictionContext} ctx
     * @return {PredictionContext}
     */
    get(ctx) {
        return this.cache.get(ctx);
    }

    /**
     * @return {number}
     */
    size() {
        return this.cache.size();
    }
}


exports = PredictionContextCache;
