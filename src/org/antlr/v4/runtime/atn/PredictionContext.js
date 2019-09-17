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
const {assert} = goog.require('goog.asserts');

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
    assert(a != null && b != null);

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

/**
 * Merge two {@link SingletonPredictionContext} instances.
 *
 * <p>Stack tops equal, parents merge is same; return left graph.<br>
 * <embed src="images/SingletonMerge_SameRootSamePar.svg" type="image/svg+xml"/></p>
 *
 * <p>Same stack top, parents differ; merge parents giving array node, then
 * remainders of those graphs. A new root node is created to point to the
 * merged parents.<br>
 * <embed src="images/SingletonMerge_SameRootDiffPar.svg" type="image/svg+xml"/></p>
 *
 * <p>Different stack tops pointing to same parent. Make array node for the
 * root where both element in the root point to the same (original)
 * parent.<br>
 * <embed src="images/SingletonMerge_DiffRootSamePar.svg" type="image/svg+xml"/></p>
 *
 * <p>Different stack tops pointing to different parents. Make array node for
 * the root where each element points to the corresponding original
 * parent.<br>
 * <embed src="images/SingletonMerge_DiffRootDiffPar.svg" type="image/svg+xml"/></p>
 *
 * @param {SingletonPredictionContext} a the first {@link SingletonPredictionContext}
 * @param {SingletonPredictionContext} b the second {@link SingletonPredictionContext}
 * @param {boolean} rootIsWildcard {@code true} if this is a local-context merge,
 * otherwise false to indicate a full-context merge
 * @param {Map<Pair<PredictionContext, PredictionContext>, PredictionContext>} mergeCache
 * @return {PredictionContext}
 */
PredictionContext.mergeSingletons = function (a, b, rootIsWildcard, mergeCache) {
    if (mergeCache != null) {
        /**
         * @type {PredictionContext}
         */
        var previous = mergeCache.get(new Pair(a, b));
        if (previous != null) return previous;
        previous = mergeCache.get(new Pair(b, a));
        if (previous != null) return previous;
    }

    var rootMerge = PredictionContext.mergeRoot(a, b, rootIsWildcard);
    if (rootMerge != null) {
        if (mergeCache != null) mergeCache.put(new Pair(a, b), rootMerge);
        return rootMerge;
    }

    if (a.returnState === b.returnState) { // a == b
        var parent = PredictionContext.merge(a.parent, b.parent, rootIsWildcard, mergeCache);
        // if parent is same as existing a or b parent or reduced to a parent, return it
        if (parent === a.parent) return a; // ax + bx = ax, if a=b
        if (parent === b.parent) return b; // ax + bx = bx, if a=b
        // else: ax + ay = a'[x,y]
        // merge parents x and y, giving array node with x,y then remainders
        // of those graphs.  dup a, a' points at merged array
        // new joined parent so create new singleton pointing to it, a'
        var a_ = SingletonPredictionContext.create(parent, a.returnState);
        if (mergeCache != null) mergeCache.put(new Pair(a, b), a_);
        return a_;
    }
    else { // a != b payloads differ
        // see if we can collapse parents due to $+x parents if local ctx
        var singleParent = null;
        if (a === b || (a.parent != null && a.parent.equals(b.parent))) { // ax + bx = [a,b]x
            singleParent = a.parent;
        }
        if (singleParent != null) {	// parents are same
            // sort payloads and use same parent
            /**
             * @type {Array.<number>}
             */
            var payloads = [a.returnState, b.returnState];
            if (a.returnState > b.returnState) {
                payloads[0] = b.returnState;
                payloads[1] = a.returnState;
            }
            /**
             * @type {Array.<PredictionContext>}
             */
            var parents = [singleParent, singleParent];
            var a_ = new ArrayPredictionContext(parents, payloads);
            if (mergeCache != null) mergeCache.put(new Pair(a, b), a_);
            return a_;
        }
        // parents differ and can't merge them. Just pack together
        // into array; can't merge.
        // ax + by = [ax,by]
        /**
        * @type {Array.<number>}
        */
        var payloads = [a.returnState, b.returnState];
        /**
         * @type {Array.<PredictionContext>}
         */
        var parents = [a.parent, b.parent];
        if (a.returnState > b.returnState) { // sort by payload
            payloads[0] = b.returnState;
            payloads[1] = a.returnState;
            parents = [b.parent, a.parent];
        }
        var a_ = new ArrayPredictionContext(parents, payloads);
        if (mergeCache != null) mergeCache.put(new Pair(a, b), a_);
        return a_;
    }
};

/**
 * Handle case where at least one of {@code a} or {@code b} is
 * {@link #EMPTY}. In the following diagrams, the symbol {@code $} is used
 * to represent {@link #EMPTY}.
 *
 * <h2>Local-Context Merges</h2>
 *
 * <p>These local-context merge operations are used when {@code rootIsWildcard}
 * is true.</p>
 *
 * <p>{@link #EMPTY} is superset of any graph; return {@link #EMPTY}.<br>
 * <embed src="images/LocalMerge_EmptyRoot.svg" type="image/svg+xml"/></p>
 *
 * <p>{@link #EMPTY} and anything is {@code #EMPTY}, so merged parent is
 * {@code #EMPTY}; return left graph.<br>
 * <embed src="images/LocalMerge_EmptyParent.svg" type="image/svg+xml"/></p>
 *
 * <p>Special case of last merge if local context.<br>
 * <embed src="images/LocalMerge_DiffRoots.svg" type="image/svg+xml"/></p>
 *
 * <h2>Full-Context Merges</h2>
 *
 * <p>These full-context merge operations are used when {@code rootIsWildcard}
 * is false.</p>
 *
 * <p><embed src="images/FullMerge_EmptyRoots.svg" type="image/svg+xml"/></p>
 *
 * <p>Must keep all contexts; {@link #EMPTY} in array is a special value (and
 * null parent).<br>
 * <embed src="images/FullMerge_EmptyRoot.svg" type="image/svg+xml"/></p>
 *
 * <p><embed src="images/FullMerge_SameRoot.svg" type="image/svg+xml"/></p>
 *
 * @param {SingletonPredictionContext} a the first {@link SingletonPredictionContext}
 * @param {SingletonPredictionContext} b the second {@link SingletonPredictionContext}
 * @param {boolean} rootIsWildcard {@code true} if this is a local-context merge,
 * otherwise false to indicate a full-context merge
 * @return {PredictionContext}
 */
PredictionContext.mergeRoot = function (a, b, rootIsWildcard) {
    if (rootIsWildcard) {
        if (a === PredictionContext.EMPTY) return a;  // * + b = *
        if (b === PredictionContext.EMPTY) return b;  // a + * = *
    }
    else {
        if (a === PredictionContext.EMPTY && b === PredictionContext.EMPTY) return a; // $ + $ = $
        if (a === PredictionContext.EMPTY) { // $ + x = [x,$]
            /**
             * @type {Array.<number>}
             */
            var payloads = [b.returnState, PredictionContext.EMPTY_RETURN_STATE];
            /**
             * @type {Array.<PredictionContext>}
             */
            var parents = [b.parent, null];
            return new ArrayPredictionContext(parents, payloads);
        }
        if (b === PredictionContext.EMPTY) { // x + $ = [x,$] ($ is always last if present)
            /**
             * @type {Array.<number>}
             */
            var payloads = [a.returnState, PredictionContext.EMPTY_RETURN_STATE];
            /**
             * @type {Array.<PredictionContext>}
             */
            var parents = [a.parent, null];
            return new ArrayPredictionContext(parents, payloads);
        }
    }
    return null;
};

/**
 * Merge two {@link ArrayPredictionContext} instances.
 *
 * <p>Different tops, different parents.<br>
 * <embed src="images/ArrayMerge_DiffTopDiffPar.svg" type="image/svg+xml"/></p>
 *
 * <p>Shared top, same parents.<br>
 * <embed src="images/ArrayMerge_ShareTopSamePar.svg" type="image/svg+xml"/></p>
 *
 * <p>Shared top, different parents.<br>
 * <embed src="images/ArrayMerge_ShareTopDiffPar.svg" type="image/svg+xml"/></p>
 *
 * <p>Shared top, all shared parents.<br>
 * <embed src="images/ArrayMerge_ShareTopSharePar.svg" type="image/svg+xml"/></p>
 *
 * <p>Equal tops, merge parents and reduce top to
 * {@link SingletonPredictionContext}.<br>
 * <embed src="images/ArrayMerge_EqualTop.svg" type="image/svg+xml"/></p>
 *
 * @param {ArrayPredictionContext} a
 * @param {ArrayPredictionContext} b
 * @param {boolean} rootIsWildcard
 * @param {Map<Pair<PredictionContext, PredictionContext>, PredictionContext>} mergeCache
 * @return {PredictionContext}
 */
PredictionContext.mergeArrays = function (a, b, rootIsWildcard, mergeCache) {
    if (mergeCache != null) {
        /**
         * @type {PredictionContext}
         */
        var previous = mergeCache.get(new Pair(a, b));
        if (previous != null) return previous;
        previous = mergeCache.get(new Pair(b, a));
        if (previous != null) return previous;
    }

    // merge sorted payloads a + b => M
    var i = 0; // walks a
    var j = 0; // walks b
    var k = 0; // walks target M array

    /**
     * @type {Array.<number>}
     */
    var mergedReturnStates = [];
    /**
     * @type {Array.<PredictionContext>}
     */
    var mergedParents = [];
    // walk and merge to yield mergedParents, mergedReturnStates
    while (i < a.returnStates.length && j < b.returnStates.length) {
        var a_parent = a.parents[i];
        var b_parent = b.parents[j];
        if (a.returnStates[i] === b.returnStates[j]) {
            // same payload (stack tops are equal), must yield merged singleton
            var payload = a.returnStates[i];
            // $+$ = $
            /**
             * @type {boolean}
             */
            var both$ = payload === PredictionContext.EMPTY_RETURN_STATE &&
                            a_parent == null && b_parent == null;
            /**
             * @type {boolean}
             */
            var ax_ax = (a_parent != null && b_parent != null) &&
                            a_parent.equals(b_parent); // ax+ax -> ax
            if (both$ || ax_ax) {
                mergedParents[k] = a_parent; // choose left
                mergedReturnStates[k] = payload;
            }
            else { // ax+ay -> a'[x,y]
                var mergedParent =
                    PredictionContext.merge(a_parent, b_parent, rootIsWildcard, mergeCache);
                mergedParents[k] = mergedParent;
                mergedReturnStates[k] = payload;
            }
            i++; // hop over left one as usual
            j++; // but also skip one in right side since we merge
        }
        else if (a.returnStates[i] < b.returnStates[j]) { // copy a[i] to M
            mergedParents[k] = a_parent;
            mergedReturnStates[k] = a.returnStates[i];
            i++;
        }
        else { // b > a, copy b[j] to M
            mergedParents[k] = b_parent;
            mergedReturnStates[k] = b.returnStates[j];
            j++;
        }
        k++;
    }

    // copy over any payloads remaining in either array
    if (i < a.returnStates.length) {
        for (var p = i; p < a.returnStates.length; p++) {
            mergedParents[k] = a.parents[p];
            mergedReturnStates[k] = a.returnStates[p];
            k++;
        }
    }
    else {
        for (var p = j; p < b.returnStates.length; p++) {
            mergedParents[k] = b.parents[p];
            mergedReturnStates[k] = b.returnStates[p];
            k++;
        }
    }

    // trim merged if we combined a few that had same stack tops
    if (k < mergedParents.length) { // write index < last position; trim
        if (k === 1) { // for just one merged element, return singleton top
            var a_ =
                SingletonPredictionContext.create(mergedParents[0],
                                                  mergedReturnStates[0]);
            if (mergeCache != null) mergeCache.put(new Pair(a, b), a_);
            return a_;
        }
        mergedParents = mergedParents.slice();
        mergedReturnStates = mergedReturnStates.slice();
    }

    var M = new ArrayPredictionContext(mergedParents, mergedReturnStates);

    // if we created same array as a or b, return that instead
    // TODO: track whether this is possible above during merge sort for speed
    if (M.equals(a)) {
        if (mergeCache != null) mergeCache.put(new Pair(a,b), a);
        return a;
    }
    if ( M.equals(b) ) {
        if (mergeCache != null) mergeCache.put(new Pair(a,b), b);
        return b;
    }

    PredictionContext.combineCommonParents(mergedParents);

    if (mergeCache != null) mergeCache.put(new Pair(a,b), M);
    return M;
};

/**
 * Make pass over all <em>M</em> {@code parents}; merge any {@code equals()}
 * ones.
 *
 * @protected
 * @param {Array.<PredictionContext>} parents
 * @return {void}
 */
PredictionContext.combineCommonParents = function (parents) {
    /**
     * @type {Map<PredictionContext, PredictionContext>}
     */
    var uniqueParents = new Map();
    for (var p = 0; p < parents.length; p++) {
        var parent = parents[p];
        if (!uniqueParents.has(parent)) { // don't replace
            uniqueParents.put(parent, parent);
        }
    }

    for (var p = 0; p < parents.length; p++) {
        parents[p] = uniqueParents.get(parents[p]);
    }
};

/**
 * @param {PredictionContext} context
 * @param {PredictionContextCache} contextCache
 * @param {Map<PredictionContext, PredictionContext>} visited
 * @return {PredictionContext}
 */
PredictionContext.getCachedContext = function (context, contextCache, visited) {
    if (context.isEmpty()) {
        return context;
    }

    var existing = visited.get(context);
    if (existing != null) {
        return existing;
    }

    existing = contextCache.get(context);
    if (existing != null) {
        visited.put(context, existing);
        return existing;
    }

    var changed = false;
    /**
     * @type {Array.<PredictionContext>}
     */
    var parents = [];
    for (var i = 0; i < context.size(); i++) {
        var parent = PredictionContext.getCachedContext(context.getParent(i), contextCache, visited);
        if (changed || parent !== context.getParent(i)) {
            if (!changed) {
                parents = [];
                for (var j = 0; j < context.size(); j++) {
                    parents[j] = context.getParent(j);
                }

                changed = true;
            }

            parents[i] = parent;
        }
    }

    if (!changed) {
        contextCache.add(context);
        visited.put(context, context);
        return context;
    }

    /**
     * @type {PredictionContext}
     */
    var updated;
    if (parents.length === 0) {
        updated = PredictionContext.EMPTY;
    }
    else if (parents.length === 1) {
        updated = SingletonPredictionContext.create(parents[0], context.getReturnState(0));
    }
    else {
        updated = new ArrayPredictionContext(parents, context.returnStates);
    }

    contextCache.add(updated);
    visited.put(updated, updated);
    visited.put(context, updated);

    return updated;
};

/**
 * @param {PredictionContext} context
 * @return {Array.<PredictionContext>}
 */
PredictionContext.getAllContextNodes = function (context) {
    /**
     * @type {Array.<PredictionContext>}
     */
    var nodes = [];
    /**
     * @type {Map<PredictionContext, PredictionContext>}
     */
    var visited = new Map(null, (a, b) => a === b);
    PredictionContext.getAllContextNodes_(context, nodes, visited);
    return nodes;
};

/**
 * @param {PredictionContext} context
 * @param {Array.<PredictionContext>} nodes
 * @param {Map<PredictionContext, PredictionContext>}
 * @return {void}
 */
PredictionContext.getAllContextNodes_ = function (context, nodes, visited) {
    if (context == null || visited.has(context)) return;
    visited.put(context, context);
    nodes.add(context);
    for (var i = 0; i < context.size(); i++) {
        PredictionContext.getAllContextNodes_(context.getParent(i), nodes, visited);
    }
};


exports = PredictionContext;
