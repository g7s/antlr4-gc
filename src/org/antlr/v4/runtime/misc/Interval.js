/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */
goog.module('org.antlr.v4.runtime.misc.Interval');


/**
 * An immutable inclusive interval a..b
 */
class Interval {
    /**
     * @param {number} a
     * @param {number} b
     */
    constructor(a, b) {
        /**
         * @type {number}
         */
        this.a = a;
        /**
         * @type {number}
         */
        this.b = b;
    }

    /**
     * return number of elements between a and b inclusively. x..x is length 1.
     * if b &lt; a, then length is 0.  9..10 has length 2.
     *
     * @return {number}
     */
    length() {
        if (this.b < this.a) return 0;
        return this.b - this.a + 1;
    }

    /**
     * @param {Object} o
     * @return {boolean}
     */
    equals(o) {
        if (o == null || !(o instanceof Interval) ) {
            return false;
        }
        return this.a === o.a && this.b === o.b;
    }

    /**
     * Does this start completely before other? Disjoint
     *
     * @param {Interval} other
     * @return {boolean}
     */
    startsBeforeDisjoint(other) {
        return this.a < other.a && this.b < other.a;
    }

    /**
     * Does this start at or before other? Nondisjoint
     *
     * @param {Interval} other
     * @return {boolean}
     */
    startsBeforeNonDisjoint(other) {
        return this.a <= other.a && this.b >= other.a;
    }

    /**
     * Does this.a start after other.b? May or may not be disjoint
     *
     * @param {Interval} other
     * @return {boolean}
     */
    startsAfter(other) {
        return this.a > other.a;
    }

    /**
     * Does this start completely after other? Disjoint
     *
     * @param {Interval} other
     * @return {boolean}
     */
    startsAfterDisjoint(other) {
        return this.a > other.b;
    }

    /**
     * Does this start after other? NonDisjoint
     *
     * @param {Interval} other
     * @return {boolean}
     */
    startsAfterNonDisjoint(other) {
        return this.a > other.a && this.a <= other.b; // this.b>=other.b implied
    }

    /**
     * Are both ranges disjoint? I.e., no overlap?
     *
     * @param {Interval} other
     * @return {boolean}
     */
    disjoint(other) {
        return this.startsBeforeDisjoint(other) || this.startsAfterDisjoint(other);
    }

    /**
     * Are two intervals adjacent such as 0..41 and 42..42?
     *
     * @param {Interval} other
     * @return {boolean}
     */
    adjacent(other) {
        return this.a === other.b + 1 || this.b === other.a - 1;
    }

    /**
     * @param {Interval} other
     * @return {boolean}
     */
    properlyContains(other) {
        return other.a >= this.a && other.b <= this.b;
    }

    /**
     * Return the interval computed from combining this and other
     *
     * @param {Interval} other
     * @return {Interval}
     */
    union(other) {
        return Interval.of(Math.min(this.a, other.a), Math.max(this.b, other.b));
    }

    /**
     * Return the interval in common between this and o
     *
     * @param {Interval} other
     * @return {Interval}
     */
    intersection(other) {
        return Interval.of(Math.max(this.a, other.a), Math.min(this.b, other.b));
    }

    /**
     * Return the interval with elements from this not in other;
     * other must not be totally enclosed (properly contained)
     * within this, which would result in two disjoint intervals
     * instead of the single one returned by this method.
     *
     * @param {Interval} other
     * @return {Interval}
     */
    differenceNotProperlyContained(other) {
        var diff = null;
        // other.a to left of this.a (or same)
        if (other.startsBeforeNonDisjoint(this)) {
            diff = Interval.of(Math.max(this.a, other.b + 1), this.b);
        }
        // other.a to right of this.a
        else if (other.startsAfterNonDisjoint(this)) {
            diff = Interval.of(this.a, other.a - 1);
        }
        return diff;
    }

    /**
     * @return {string}
     */
    toString() {
        return this.a + ".." + this.b;
    }
}

/**
 * @type {number}
 */
Interval.INTERVAL_POOL_MAX_VALUE = 1000;

/**
 * @type {Interval}
 */
Interval.INVALID = new Interval(-1, -2);

/**
 * @type {Array<Interval>}
 */
Interval.cache = [];

/**
 * Interval objects are used readonly so share all with the
 * same single value a==b up to some max size.  Use an array as a perfect hash.
 * Return shared object for 0..INTERVAL_POOL_MAX_VALUE or a new
 * Interval object with a..a in it.  On Java.g4, 218623 IntervalSets
 * have a..a (set with 1 element).
 *
 * @param {number} a
 * @param {number} b
 */
Interval.of = function (a, b) {
    // cache just a..a
    if (a !== b || a < 0 || a > Interval.INTERVAL_POOL_MAX_VALUE) {
        return new Interval(a, b);
    }
    if (!Interval.cache[a]) {
        Interval.cache[a] = new Interval(a, a);
    }
    return Interval.cache[a];
};

exports = Interval;
