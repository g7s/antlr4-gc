/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.Transition');
goog.module.declareLegacyNamespace();


/** An ATN transition between any two ATN states.  Subclasses define
 *  atom, set, epsilon, action, predicate, rule transitions.
 *
 *  <p>This is a one way link.  It emanates from a state (usually via a list of
 *  transitions) and has a target state.</p>
 *
 *  <p>Since we never have to change the ATN transitions once we construct it,
 *  we can fix these transitions as specific classes. The DFA transitions
 *  on the other hand need to update the labels as it adds transitions to
 *  the states. We'll use the term Edge for the DFA to distinguish them from
 *  ATN transitions.</p>
 *
 * @abstract
 */
class Transition {
    /**
     * @param {org.antlr.v4.runtime.atn.ATNState} target
     */
    constructor(target) {
        if (target == null) {
            throw new Error("target cannot be null.");
        }
        /**
         * The target of this transition.
         * @type {org.antlr.v4.runtime.atn.ATNState}
         */
        this.target = target;
    }

    /**
     * @abstract
     * @return {number}
     */
    getSerializationType() {}

    /**
     * Determines if the transition is an "epsilon" transition.
     *
     * <p>The default implementation returns {@code false}.</p>
     *
     * @return {boolean} {@code true} if traversing this transition in the ATN does not
     * consume an input symbol; otherwise, {@code false} if traversing this
     * transition consumes (matches) an input symbol.
     */
    isEpsilon() {
        return false;
    }

    /**
     * @return {org.antlr.v4.runtime.misc.IntervalSet}
     */
    label() {
        return null;
    }

    /**
     * @abstract
     * @param {number} symbol
     * @param {number} minVocabSymbol
     * @param {number} maxVocabSymbol
     * @return {boolean}
     */
    matches(symbol, minVocabSymbol, maxVocabSymbol) {}
}

// constants for serialization
/**
 * @type {number}
 */
Transition.EPSILON = 1;
/**
 * @type {number}
 */
Transition.RANGE = 2;
/**
 * @type {number}
 */
Transition.RULE = 3;
/**
 * @type {number}
 */
Transition.PREDICATE = 4; // e.g., {isType(input.LT(1))}?
/**
 * @type {number}
 */
Transition.ATOM = 5;
/**
 * @type {number}
 */
Transition.ACTION = 6;
/**
 * @type {number}
 */
Transition.SET = 7; // ~(A|B) or ~atom, wildcard, which convert to next 2
/**
 * @type {number}
 */
Transition.NOT_SET = 8;
/**
 * @type {number}
 */
Transition.WILDCARD = 9;
/**
 * @type {number}
 */
Transition.PRECEDENCE = 10;
/**
 * @type {Array<string>}
 */
Transition.serializationNames = [
    "INVALID",
    "EPSILON",
    "RANGE",
    "RULE",
    "PREDICATE",
    "ATOM",
    "ACTION",
    "SET",
    "NOT_SET",
    "WILDCARD",
    "PRECEDENCE"
];
/**
 * @type {WeakMap}
 */
Transition.serializationTypes = new WeakMap();
// Transition.serializationTypes = {
//     EpsilonTransition: Transition.EPSILON,
//     RangeTransition: Transition.RANGE,
//     RuleTransition: Transition.RULE,
//     PredicateTransition: Transition.PREDICATE,
//     AtomTransition: Transition.ATOM,
//     ActionTransition: Transition.ACTION,
//     SetTransition: Transition.SET,
//     NotSetTransition: Transition.NOT_SET,
//     WildcardTransition: Transition.WILDCARD,
//     PrecedencePredicateTransition: Transition.PRECEDENCE,
// };


exports = Transition;
