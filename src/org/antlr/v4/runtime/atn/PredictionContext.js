/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.PredictionContext');


const EmptyPredictionContext = goog.require('org.antlr.v4.runtime.atn.EmptyPredictionContext');
const SingletonPredictionContext = goog.require('org.antlr.v4.runtime.atn.SingletonPredictionContext');
const ArrayPredictionContext = goog.require('org.antlr.v4.runtime.atn.ArrayPredictionContext');
const Recognizer = goog.require('org.antlr.v4.runtime.Recognizer');
const RuleContext = goog.require('org.antlr.v4.runtime.RuleContext');
const Map = goog.require('org.antlr.v4.runtime.misc.Map');
const Pair = goog.require('org.antlr.v4.runtime.misc.Pair');
const MurmurHash = goog.require('org.antlr.v4.runtime.misc.MurmurHash');

/**
 * @abstract
 */
class PredictionContext {
    /**
     * @param {number} cachedHashCode
     */
    constructor(cachedHashCode) {
        /**
         * @type {number}
         */
        this.id = PredictionContext.globalNodeCount++;

        /**
         * Stores the computed hash code of this {@link PredictionContext}. The hash
         * code is computed in parts to match the following reference algorithm.
         *
         * <pre>
         *  private int referenceHashCode() {
         *      int hash = {@link MurmurHash#initialize MurmurHash.initialize}({@link #INITIAL_HASH});
         *
         *      for (int i = 0; i &lt; {@link #size()}; i++) {
         *          hash = {@link MurmurHash#update MurmurHash.update}(hash, {@link #getParent getParent}(i));
         *      }
         *
         *      for (int i = 0; i &lt; {@link #size()}; i++) {
         *          hash = {@link MurmurHash#update MurmurHash.update}(hash, {@link #getReturnState getReturnState}(i));
         *      }
         *
         *      hash = {@link MurmurHash#finish MurmurHash.finish}(hash, 2 * {@link #size()});
         *      return hash;
         *  }
         * </pre>
         *
         * @type {number}
         */
        this.cachedHashCode = cachedHashCode;
    }

    /**
     * @abstract
     * @return {number}
     */
    size() {}

    /**
     * @abstract
     * @param {number} index
     * @return {PredictionContext}
     */
    getParent(index) {}

    /**
     * @abstract
     * @param {number} index
     * @return {number}
     */
    getReturnState(index) {}

    /**
     * This means only the {@link #EMPTY} (wildcard? not sure) context is in set.
     *
     * @return {boolean}
     */
    isEmpty() {
        return this === PredictionContext.EMPTY;
    }

    /**
     * @return {boolean}
     */
    hasEmptyPath() {
        // since EMPTY_RETURN_STATE can only appear in the last position, we check last one
        return this.getReturnState(this.size() - 1) === PredictionContext.EMPTY_RETURN_STATE;
    }

    /**
     * @return {number}
     */
    hashCode() {
        return this.cachedHashCode;
    }

    /**
     * @abstract
     * @param {Object} obj
     * @return {boolean}
     */
    equals(obj) {}
}

/**
 * Represents {@code $} in local context prediction, which means wildcard.
 * {@code *+x = *}.
 *
 * @type {EmptyPredictionContext}
 */
PredictionContext.EMPTY = new EmptyPredictionContext();

/**
 * Represents {@code $} in an array in full context mode, when {@code $}
 * doesn't mean wildcard: {@code $ + x = [$,x]}. Here,
 * {@code $} = {@link #EMPTY_RETURN_STATE}.
 *
 * @type {number}
 */
PredictionContext.EMPTY_RETURN_STATE = Number.MAX_VALUE;

/**
 * @private {number}
 */
PredictionContext.INITIAL_HASH = 1;

/**
 * @type {number}
 */
PredictionContext.globalNodeCount = 0;

/**
 * Convert a {@link RuleContext} tree to a {@link PredictionContext} graph.
 * Return {@link #EMPTY} if {@code outerContext} is empty or null.
 *
 * @param {org.antlr.v4.runtime.atn.ATN} atn
 * @param {RuleContext} outerContext
 * @return {PredictionContext}
 */
PredictionContext.fromRuleContext = function (atn, outerContext) {
    if (outerContext == null) outerContext = RuleContext.EMPTY;

    // if we are in RuleContext of start rule, s, then PredictionContext
    // is EMPTY. Nobody called us. (if we are empty, return empty)
    if (outerContext.parent == null || outerContext === RuleContext.EMPTY) {
        return PredictionContext.EMPTY;
    }

    // If we have a parent, convert it to a PredictionContext graph
    var parent = PredictionContext.EMPTY;
    parent = PredictionContext.fromRuleContext(atn, outerContext.parent);

    var state = atn.states[outerContext.invokingState];
    var transition = state.transition(0);
    return SingletonPredictionContext.create(parent, transition.followState.stateNumber);
};

/**
 * @return {number}
 */
PredictionContext.calculateEmptyHashCode = function () {
    var hash = MurmurHash.initialize(PredictionContext.INITIAL_HASH);
    hash = MurmurHash.finish(hash, 0);
    return hash;
};

/**
 * @param {PredictionContext|Array.<PredictionContext>} parents
 * @param {number|Array.<number>} returnStates
 * @return {number}
 */
PredictionContext.calculateHashCode = function (parents, returnStates) {
    parents = goog.isArray(parents) ? parents : [parents];
    returnStates = goog.isArray(returnStates) ? returnStates : [returnStates];
    var hash = MurmurHash.initialize(PredictionContext.INITIAL_HASH);
    parents.forEach(parent => {
        hash = MurmurHash.update(hash, parent);
    });
    returnStates.forEach(returnState => {
        hash = MurmurHash.update(hash, returnState);
    });
    return MurmurHash.finish(hash, 2 * parents.length);
};

/**
 * @param {!PredictionContext} a
 * @param {!PredictionContext} b
 * @param {boolean} rootIsWildcard
 * @param {Map<Pair<PredictionContext, PredictionContext>, PredictionContext>} mergeCache
 * @return {PredictionContext}
 */
PredictionContext.merge = function (a, b, rootIsWildcard, mergeCache) {
    // share same graph if both same
    if (a === b || a.equals(b)) return a;

    if (a instanceof SingletonPredictionContext && b instanceof SingletonPredictionContext) {
        return PredictionContext.mergeSingletons(a, b, rootIsWildcard, mergeCache);
    }

    // At least one of a or b is array
    // If one is $ and rootIsWildcard, return $ as * wildcard
    if (rootIsWildcard) {
        if (a instanceof EmptyPredictionContext) return a;
        if (b instanceof EmptyPredictionContext) return b;
    }

    // convert singleton so both are arrays to normalize
    if (a instanceof SingletonPredictionContext) {
        a = new ArrayPredictionContext(a);
    }
    if (b instanceof SingletonPredictionContext) {
        b = new ArrayPredictionContext(b);
    }
    return PredictionContext.mergeArrays(a, b, rootIsWildcard, mergeCache);
};


exports = PredictionContext;
