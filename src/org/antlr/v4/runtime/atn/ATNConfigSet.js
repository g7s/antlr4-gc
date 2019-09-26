/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.ATNConfigSet');
goog.module.declareLegacyNamespace();


const ATN = goog.require('org.antlr.v4.runtime.atn.ATN');
const SemanticContext = goog.require('org.antlr.v4.runtime.atn.SemanticContext');
const PredictionContext = goog.require('org.antlr.v4.runtime.atn.PredictionContext');
const Set = goog.require('org.antlr.v4.runtime.misc.Set');
const BitSet = goog.require('org.antlr.v4.runtime.misc.BitSet');
const Map = goog.require('org.antlr.v4.runtime.misc.Map');
const Pair = goog.require('org.antlr.v4.runtime.misc.Pair');
const {every} = goog.require('goog.array');

/**
 * @param {!Array<org.antlr.v4.runtime.atn.ATNConfig>} configs
 * @return {number}
 */
const configsHashCode = (configs) => {
    var hashCode = 0;
    configs.forEach(c => {
        hashCode = (31 * hashCode + c.hashCode()) >>> 0;
    });
    return hashCode;
};

/**
 * @param {org.antlr.v4.runtime.atn.ATNConfig} o
 * @return {number}
 */
const configHashCode = (o) => {
    var hashCode = 7;
    hashCode = 31 * hashCode + o.state.stateNumber;
    hashCode = 31 * hashCode + o.alt;
    hashCode = 31 * hashCode + o.semanticContext.hashCode();
    return hashCode;
};

/**
 * @param {org.antlr.v4.runtime.atn.ATNConfig} a
 * @param {org.antlr.v4.runtime.atn.ATNConfig} b
 * @return {boolean}
 */
const configEquals = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    return a.state.stateNumber === b.state.stateNumber
        && a.alt === b.alt
        && a.semanticContext.equals(b.semanticContext);
};

/**
 * Specialized {@link Set}{@code <}{@link ATNConfig}{@code >} that can track
 * info about the set, with support for combining similar configurations using a
 * graph-structured stack.
 *
 * @implements {Iterable}
 */
class ATNConfigSet {
    /**
     * @param {(boolean|ATNConfigSet)=} o
     */
    constructor(o) {
        if (!goog.isDef(o)) o = false;
        /**
         * Indicates that the set of configurations is read-only. Do not
         * allow any code to manipulate the set; DFA states will point at
         * the sets and they must not change. This does not protect the other
         * fields; in particular, conflictingAlts is set after
         * we've made this readonly.
         *
         * @protected {boolean}
          */
        this.readonly = false;

        /**
         * All configs but hashed by (s, i, _, pi) not including context. Wiped out
         * when we go readonly as this set becomes a DFA state.
         *
         * @type {!Set<org.antlr.v4.runtime.atn.ATNConfig>}
         */
        this.configLookup = new Set(configHashCode, configEquals);

        /**
         * Track the elements as they are added to the set; supports get(i)
         *
         * @type {!Array<org.antlr.v4.runtime.atn.ATNConfig>}
         */
        this.configs = [];

        /**
         * @type {number}
         */
        this.uniqueAlt = 0;

        /**
         * Currently this is only used when we detect SLL conflict; this does
         * not necessarily represent the ambiguous alternatives. In fact,
         * I should also point out that this seems to include predicated alternatives
         * that have predicates that evaluate to false. Computed in computeTargetState().
         *
         * @type {BitSet}
         */
        this.conflictingAlts = null;

        // Used in parser and lexer. In lexer, it indicates we hit a pred
        // while computing a closure operation.  Don't make a DFA state from this.
        /**
         * @type {boolean}
         */
        this.hasSemanticContext = false;
        /**
         * @type {boolean}
         */
        this.dipsIntoOuterContext = false;

        /**
         * Indicates that this configuration set is part of a full context
         * LL prediction. It will be used to determine how to merge $. With SLL
         * it's a wildcard whereas it is not for LL context merge.
         *
         * @type {boolean}
         */
        this.fullCtx = false;

        /**
         * @private {number}
         */
        this.cachedHashCode = -1;

        if (goog.isBoolean(o)) {
            this.fullCtx = o;
        } else {
            this.addAll(o || []);
            this.uniqueAlt = o.uniqueAlt;
            this.conflictingAlts = o.conflictingAlts;
            this.hasSemanticContext = o.hasSemanticContext;
            this.dipsIntoOuterContext = o.dipsIntoOuterContext;
        }
    }

    /**
     * Adding a new config means merging contexts with existing configs for
     * {@code (s, i, pi, _)}, where {@code s} is the
     * {@link ATNConfig#state}, {@code i} is the {@link ATNConfig#alt}, and
     * {@code pi} is the {@link ATNConfig#semanticContext}. We use
     * {@code (s,i,pi)} as key.
     *
     * <p>This method updates {@link #dipsIntoOuterContext} and
     * {@link #hasSemanticContext} when necessary.</p>
     *
     * @param {org.antlr.v4.runtime.atn.ATNConfig} config
     * @param {Map<Pair<PredictionContext, PredictionContext>, PredictionContext>=} mergeCache
     * @return {boolean}
     */
    add(config, mergeCache) {
        if (this.readonly) throw new Error("This set is readonly");
        if (config.semanticContext !== SemanticContext.NONE) {
            this.hasSemanticContext = true;
        }
        if (config.getOuterContextDepth() > 0) {
            this.dipsIntoOuterContext = true;
        }
        var existing = this.configLookup.get(config);
        if (goog.isNull(existing)) {
            this.configLookup.add(config);
            existing = config;
        }
        if (existing === config) { // we added this new one
            this.cachedHashCode = -1;
            this.configs.push(config);  // track order here
            return true;
        }
        // a previous (s,i,pi,_), merge with it and save result
        var rootIsWildcard = !this.fullCtx;
        var merged = PredictionContext.merge(existing.context, config.context, rootIsWildcard, mergeCache || null);
        // no need to check for existing.context, config.context in cache
        // since only way to create new graphs is "call rule" and here. We
        // cache at both places.
        existing.reachesIntoOuterContext =
            Math.max(existing.reachesIntoOuterContext, config.reachesIntoOuterContext);

        // make sure to preserve the precedence filter suppression during the merge
        if (config.isPrecedenceFilterSuppressed()) {
            existing.setPrecedenceFilterSuppressed(true);
        }

        existing.context = merged; // replace context; no need to alt mapping
        return true;
    }

    /**
     * Return a List holding list of configs
     *
     * @return {Array<org.antlr.v4.runtime.atn.ATNConfig>}
     */
    elements() {
        return this.configs;
    }

    /**
     * @return {Set<org.antlr.v4.runtime.atn.ATNState>}
     */
    getStates() {
        /**
         * @type {Set<org.antlr.v4.runtime.atn.ATNState>}
         */
        var states = new Set();
        for (const c of this.configs) {
            states.add(c.state);
        }
        return states;
    }

    /**
     * Gets the complete set of represented alternatives for the configuration
     * set.
     *
     * @return {BitSet} the set of represented alternatives in this configuration set
     *
     * @since 4.3
     */
    getAlts() {
        var alts = new BitSet();
        for (const c of this.configs) {
            alts.set(c.alt);
        }
        return alts;
    }

    /**
     * @return {!Array<SemanticContext>}
     */
    getPredicates() {
        /**
         * @type {!Array<SemanticContext>}
         */
        var preds = [];
        for (const c of this.configs) {
            if (c.semanticContext !== SemanticContext.NONE) {
                preds.push(c.semanticContext);
            }
        }
        return preds;
    }

    /**
     *
     * @param {number} i
     * @return {org.antlr.v4.runtime.atn.ATNConfig}
     */
    get(i) {
        return this.configs[i];
    }

    /**
     * @param {org.antlr.v4.runtime.atn.ATNSimulator} interpreter
     * @return {void}
     */
    optimizeConfigs(interpreter) {
        if (this.readonly) throw new Error("This set is readonly");
        if (this.configLookup.isEmpty()) return;

        for (const config of this.configs) {
//			int before = PredictionContext.getAllContextNodes(config.context).size();
            config.context = interpreter.getCachedContext(config.context);
//			int after = PredictionContext.getAllContextNodes(config.context).size();
//			System.out.println("configs "+before+"->"+after);
        }
    }

    /**
     * @param {!Array<org.antlr.v4.runtime.atn.ATNConfig>|!org.antlr.v4.runtime.atn.ATNConfigSet} coll
     * @return {boolean}
     */
    addAll(coll) {
        for (const c of coll) {
            this.add(c);
        }
        return false;
    }

    /**
     * @param {Object} o
     * @return {boolean}
     */
    equals(o) {
        if (o === this) {
            return true;
        }
        else if (!(o instanceof ATNConfigSet)) {
            return false;
        }

//		System.out.print("equals " + this + ", " + o+" = ");
        return this.configs != null &&
            every(this.configs, (c, i) => c.equals(o.configs[i])) &&
            this.fullCtx === o.fullCtx &&
            this.uniqueAlt === o.uniqueAlt &&
            this.conflictingAlts === o.conflictingAlts &&
            this.hasSemanticContext === o.hasSemanticContext &&
            this.dipsIntoOuterContext === o.dipsIntoOuterContext;
    }

    /**
     * @return {number}
     */
    hashCode() {
        if (this.isReadonly()) {
            if (this.cachedHashCode === -1) {
                this.cachedHashCode = configsHashCode(this.configs);
            }
            return this.cachedHashCode;
        }
        return configsHashCode(this.configs);
    }

    size() {
        return this.configs.length;
    }

    isEmpty() {
        return this.size() === 0;
    }

    contains(o) {
        if (this.readonly) {
            throw new Error("This method is not implemented for readonly sets.");
        }

        return this.configLookup.contains(o);
    }

    [Symbol.iterator]() {
        return this.configs[Symbol.iterator]();
    }

    clear() {
        if (this.readonly) throw new Error("This set is readonly");
        this.configs = [];
        this.cachedHashCode = -1;
        this.configLookup.clear();
    }

    /**
     * @return {boolean}
     */
    isReadonly() {
        return this.readonly;
    }

    /**
     * @param {boolean} readonly
     * @return {void}
     */
    setReadonly(readonly) {
        this.readonly = readonly;
        readonly && this.configLookup.clear(); // can't mod, no need for lookup cache
    }

    /**
     * @return {string}
     */
    toString() {
        var buf = "";
        buf += "[" + this.elements().join(", ") + "]";
        if (this.hasSemanticContext) buf += (",hasSemanticContext=" + this.hasSemanticContext);
        if (this.uniqueAlt !== ATN.INVALID_ALT_NUMBER) buf += (",uniqueAlt=" + this.uniqueAlt);
        if (this.conflictingAlts != null) buf += (",conflictingAlts=" + this.conflictingAlts);
        if (this.dipsIntoOuterContext) buf += ",dipsIntoOuterContext";
        return buf;
    }
}


exports = ATNConfigSet;
