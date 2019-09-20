/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.misc.IntervalSet');


const IntSet = goog.require('org.antlr.v4.runtime.misc.IntSet');
const Interval = goog.require('org.antlr.v4.runtime.misc.Interval');
const Lexer = goog.require('org.antlr.v4.runtime.Lexer');
const Token = goog.require('org.antlr.v4.runtime.Token');
const {forEach, every} = goog.require('goog.array');

/**
 * This class implements the {@link IntSet} backed by a sorted array of
 * non-overlapping intervals. It is particularly efficient for representing
 * large collections of numbers, where the majority of elements appear as part
 * of a sequential range of numbers that are all part of the set. For example,
 * the set { 1, 2, 3, 4, 7, 8 } may be represented as { [1, 4], [7, 8] }.
 *
 * <p>
 * This class is able to represent sets containing any combination of values in
 * the range {@link Integer#MIN_VALUE} to {@link Integer#MAX_VALUE}
 * (inclusive).</p>
 *
 * @implements {IntSet}
 */
class IntervalSet {
    /**
     * @param {*=} obj
     */
    constructor(obj) {
        /**
         * The list of sorted, disjoint intervals.
         *
         * @protected {Array<Interval>}
         */
        this.intervals = [];
        /**
         * @protected {boolean}
         */
        this.readonly = false;

        if (obj instanceof IntervalSet) {
            this.addAll(obj);
        } else if (goog.isArray(obj)) {
            this.intervals = obj;
        } else {
            forEach(arguments, int => {
                if (goog.isNumber(int)) this.add(int);
            });
        }
    }

    /**
     * @return {void}
     */
    clear() {
        if (this.readonly) {
            throw new Error("can't alter readonly IntervalSet");
        }
		this.intervals = [];
    }

    add(el) {
        if (this.readonly) {
            throw new Error("can't alter readonly IntervalSet");
        }
        this.addRange(el, el);
    }

    /**
     * Add interval; i.e., add all integers from a to b to set.
     * If b&lt;a, do nothing.
     * Keep list in sorted order (by left range value).
     * If overlap, combine ranges.  For example,
     * If this is {1..5, 10..20}, adding 6..7 yields
     * {1..5, 6..7, 10..20}.  Adding 4..8 yields {1..8, 10..20}.
     *
     * @param {number} a
     * @param {number=} b
     * @return {void}
     */
    addRange(a, b) {
        this.addInterval(Interval.of(a, b || a));
    }

    /**
     * @protected
     * @param {Interval} addition
     * @return {void}
     */
    addInterval(addition) {
        if (this.readonly) {
            throw new Error("can't alter readonly IntervalSet");
        }
        //System.out.println("add "+addition+" to "+intervals.toString());
        if (addition.b < addition.a) {
            return;
        }
        // find position in list
        // Use iterators as we modify list in place
        for (var k = 0; k < this.intervals.length; k++) {
            /**
             * @type {Interval}
             */
            var r = this.intervals[k];
            if (addition.equals(r)) {
                return;
            }
            if (addition.adjacent(r) || !addition.disjoint(r)) {
                // next to each other, make a single larger interval
                var bigger = addition.union(r);
                this.intervals[k] = bigger;
                // make sure we didn't just create an interval that
                // should be merged with next interval in list
                for (var j = k + 1; j < this.intervals.length; j++) {
                    var curr = this.intervals[k];
                    var next = this.intervals[j];
                    if (!curr.adjacent(next) && curr.disjoint(next)) {
                        break;
                    }
                    this.intervals[k] = curr.union(next);
                }
                return;
            }
            if (addition.startsBeforeDisjoint(r)) {
                this.intervals.splice(k, 0, addition);
                return;
            }
            // if disjoint and after r, a future iteration will handle it
        }
        // ok, must be after last interval (and disjoint from last interval)
        // just add it
        this.intervals.push(addition);
    }

    addAll(set) {
        if (set == null) {
            return this;
        }
        if (set instanceof IntervalSet) {
            // walk set and add each interval
            var n = set.intervals.length;
            for (var i = 0; i < n; i++) {
                var s = set.intervals[i];
                this.addRange(s.a, s.b);
            }


        }
        else {
            set.toList().forEach(v => this.add(v));
        }
        return this;
    }

    /**
     * @param {number} minElement
     * @param {number} maxElement
     * @return {IntervalSet}
     */
    complementRange(minElement, maxElement) {
        return /** @type {IntervalSet} */ (this.complement(IntervalSet.of(minElement, maxElement)));
    }

    complement(vocabulary) {
        if (vocabulary == null || vocabulary.isNil()) {
            return null; // nothing in common with null set
        }
        var vocabularyIS;
        if (vocabulary instanceof IntervalSet) {
            vocabularyIS = vocabulary;
        }
        else {
            vocabularyIS = new IntervalSet();
            vocabularyIS.addAll(vocabulary);
        }
        return vocabularyIS.subtract(this);
    }

    subtract(a) {
        if (a == null || a.isNil()) {
            return new IntervalSet(this);
        }

        if (a instanceof IntervalSet) {
            return IntervalSet.subtract(this, a);
        }

        var other = new IntervalSet();
        other.addAll(a);
        return IntervalSet.subtract(this, other);
    }

    or(a) {
        var o = new IntervalSet();
        o.addAll(this);
        o.addAll(a);
        return o;
    }

    and(other) {
        if (other == null) { //|| !(other instanceof IntervalSet) ) {
            return null; // nothing in common with null set
        }
        var myIntervals = this.intervals;
        var theirIntervals = /** @type {IntervalSet} */ (other).intervals;
        var intersection = new IntervalSet();
        var mySize = this.intervals.length;
        var theirSize = other.intervals.length;
        var i = 0;
        var j = 0;
        // iterate down both interval lists looking for nondisjoint intervals
        while (i < mySize && j < theirSize) {
            var mine = myIntervals[i];
            var theirs = theirIntervals[j];
            //System.out.println("mine="+mine+" and theirs="+theirs);
            if (mine.startsBeforeDisjoint(theirs)) {
                // move this iterator looking for interval that might overlap
                i++;
            }
            else if (theirs.startsBeforeDisjoint(mine)) {
                // move other iterator looking for interval that might overlap
                j++;
            }
            else if (mine.properlyContains(theirs)) {
                // overlap, add intersection, get next theirs
                intersection.add(mine.intersection(theirs));
                j++;
            }
            else if ( theirs.properlyContains(mine) ) {
                // overlap, add intersection, get next mine
                intersection.add(mine.intersection(theirs));
                i++;
            }
            else if ( !mine.disjoint(theirs) ) {
                // overlap, add intersection
                intersection.add(mine.intersection(theirs));
                // Move the iterator of lower range [a..b], but not
                // the upper range as it may contain elements that will collide
                // with the next iterator. So, if mine=[0..115] and
                // theirs=[115..200], then intersection is 115 and move mine
                // but not theirs as theirs may collide with the next range
                // in thisIter.
                // move both iterators to next ranges
                if (mine.startsAfterNonDisjoint(theirs)) {
                    j++;
                }
                else if (theirs.startsAfterNonDisjoint(mine)) {
                    i++;
                }
            }
        }
        return intersection;
    }

    contains(el) {
        var n = this.intervals.length;
        var l = 0;
        var r = n - 1;
        // Binary search for the element in the (sorted,
        // disjoint) array of intervals.
        while (l <= r) {
            var m = (l + r) / 2;
            var I = this.intervals[m];
            var a = I.a;
            var b = I.b;
            if (b < el) {
                l = m + 1;
            } else if (a > el) {
                r = m - 1;
            } else { // el >= a && el <= b
                return true;
            }
        }
        return false;
    }

    isNil() {
        return this.intervals.length === 0;
    }

    /**
     * Returns the maximum value contained in the set if not isNil().
     *
     * @return {number} the maximum value contained in the set.
     * @throws {Error} RuntimeException if set is empty
     */
    getMaxElement() {
        if (this.isNil()) {
            throw new Error("set is empty");
        }
        var last = this.intervals[this.intervals.length - 1];
        return last.b;
    }

    /**
     * Returns the minimum value contained in the set if not isNil().
     *
     * @return {number} the minimum value contained in the set.
     * @throws {Error} RuntimeException if set is empty
     */
    getMinElement() {
        if (this.isNil()) {
            throw new Error("set is empty");
        }
        return this.intervals[0].a;
    }

    /**
     * Return a list of Interval objects.
     *
     * @return {Array<Interval>}
     */
    getIntervals() {
        return this.intervals;
    }

    equals(obj) {
        if (obj == null || !(obj instanceof IntervalSet)) {
            return false;
        }
        return IntervalSet.equals(this, obj);
    }

    toString() {
        var str = "";
        this.intervals.forEach(I => {
            var a = I.a;
            var b = I.b;
            if (a === b) {
                str += (a === Token.EOF ? "<EOF>" : a);
            }
            else {
                str += (a + ".." + b);
            }
        });
        if (this.size() > 1) {
            str = "{" + str + "}";
        }
        return str;
    }

    /**
     * @param {org.antlr.v4.runtime.Vocabulary} vocabulary
     * @return {string}
     */
    toStringWithVocabulary(vocabulary) {
        var str = "";
        for (var i = 0; i < this.intervals.length; i++) {
            var I = this.intervals[i];
            var a = I.a;
            var b = I.b;
            if (a === b) {
                str += this.elementName(vocabulary, a);
            }
            else {
                for (var j = a; j <= b; j++) {
                    if (j > a) str += ", ";
                    str += this.elementName(vocabulary, j);
                }
            }
            if (this.intervals[i+1]) {
                str += ", ";
            }
        }
        if (this.size() > 1) {
            str = "{" + str + "}";
        }
        return str;
    }

    /**
     * @protected
     * @param {org.antlr.v4.runtime.Vocabulary} vocabulary
     * @param {number} a
     * @return {string}
     */
    elementName(vocabulary, a) {
        if (a == Token.EOF) {
            return "<EOF>";
        }
        else if (a == Token.EPSILON) {
            return "<EPSILON>";
        }
        else {
            return vocabulary.getDisplayName(a);
        }
    }

    size() {
        var n = 0;
        var numIntervals = this.intervals.length;
        for (var i = 0; i < numIntervals; i++) {
            var v = this.intervals[i];
            n += (v.b - v.a + 1);
        }
        return n;
    }

    /**
     * @return {Array<number>}
     */
    toIntegerList() {
        /**
         * @type {Array<number>}
         */
        var values = [];
        for (var i = 0; i < this.intervals.length; i++) {
            var v = this.intervals[i];
            for (var j = v.a; j <= v.b; j++) {
                values.push(j);
            }
        }
        return values;
    }

    toList() {
        return this.toIntegerList();
    }

    /**
     * @return {Set.<number>}
     */
    toSet() {
        var s = new Set();
        for (const v of s) {
            for (var j = v.a; j <= v.b; j++) {
                s.add(j);
            }
        }
        return s;
    }

    /**
     * Get the ith element of ordered set.  Used only by RandomPhrase so
     * don't bother to implement if you're not doing that for a new
     * ANTLR code gen target.
     *
     * @param {number} i
     * @return {number}
     */
    get(i) {
        var n = this.intervals.length;
        var index = 0;
        for (var j = 0; j < n; j++) {
            var v = this.intervals[j];
            for (var k = v.a; k <= v.b; k++) {
                if (index === i) {
                    return k;
                }
                index++;
            }
        }
        return -1;
    }

    /**
     * @return {Array<number>}
     */
    toArray() {
        return this.toIntegerList();
    }

    remove(el) {
        if (this.readonly) throw new Error("can't alter readonly IntervalSet");
        var n = this.intervals.length;
        for (var i = 0; i < n; i++) {
            var v = this.intervals[i];
            if (el < v.a) {
                break; // list is sorted and el is before this interval; not here
            }
            // if whole interval x..x, rm
            if (el === v.a && el === v.b) {
                this.intervals.splice(i, 1);
                break;
            }
            // if on left edge x..b, adjust left
            if (el === v.a) {
                v.a++;
                break;
            }
            // if on right edge a..x, adjust right
            if (el === v.b) {
                v.b--;
                break;
            }
            // if in middle a..x..b, split interval
            if (el > v.a && el < v.b) { // found in this interval
                var oldb = v.b;
                v.b = el - 1;      // [a..x-1]
                this.addRange(el + 1, oldb); // add [x+1..b]
            }
        }
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
        if (this.readonly && !readonly) throw new Error("can't alter readonly IntervalSet");
        this.readonly = readonly;
    }
}

/**
 * @param {number} a
 * @param {number=} b
 * @return {IntervalSet}
 */
IntervalSet.of = function (a, b) {
    var s = new IntervalSet();
    s.addRange(a, b);
    return s;
};

/**
 * combine all sets in the array returned the or'd value
 *
 * @param {Array<IntervalSet>} sets
 * @return {IntervalSet}
 */
IntervalSet.or = function (sets) {
    var r = new IntervalSet();
    sets.forEach((s) => r.addAll(s));
    return r;
};

/**
 * Compute the set difference between two interval sets. The specific
 * operation is {@code left - right}. If either of the input sets is
 * {@code null}, it is treated as though it was an empty set.
 *
 * @param {IntervalSet} left
 * @param {IntervalSet} right
 * @return {IntervalSet}
 */
IntervalSet.subtract = function (left, right) {
    if (left == null || left.isNil()) {
        return new IntervalSet();
    }

    var result = new IntervalSet(left);
    if (right == null || right.isNil()) {
        // right set has no elements; just return the copy of the current set
        return result;
    }

    var resultI = 0;
    var rightI = 0;
    while (resultI < result.intervals.length && rightI < right.intervals.length) {
        var resultInterval = result.intervals[resultI];
        var rightInterval = right.intervals[rightI];

        // operation: (resultInterval - rightInterval) and update indexes

        if (rightInterval.b < resultInterval.a) {
            rightI++;
            continue;
        }

        if (rightInterval.a > resultInterval.b) {
            resultI++;
            continue;
        }

        var beforeCurrent = null;
        var afterCurrent = null;
        if (rightInterval.a > resultInterval.a) {
            beforeCurrent = new Interval(resultInterval.a, rightInterval.a - 1);
        }

        if (rightInterval.b < resultInterval.b) {
            afterCurrent = new Interval(rightInterval.b + 1, resultInterval.b);
        }

        if (beforeCurrent != null) {
            if (afterCurrent != null) {
                // split the current interval into two
                result.intervals[resultI] = beforeCurrent;
                result.intervals.splice(resultI + 1, 0, afterCurrent);
                resultI++;
                rightI++;
                continue;
            }
            else {
                // replace the current interval
                result.intervals[resultI] = beforeCurrent;
                resultI++;
                continue;
            }
        }
        else {
            if (afterCurrent != null) {
                // replace the current interval
                result.intervals[resultI] = afterCurrent;
                rightI++;
                continue;
            }
            else {
                // remove the current interval (thus no need to increment resultI)
                result.intervals.splice(resultI, 1);
                continue;
            }
        }
    }

    // If rightI reached right.intervals.size(), no more intervals to subtract from result.
    // If resultI reached result.intervals.size(), we would be subtracting from an empty set.
    // Either way, we are done.
    return result;
};

/**
 * @param {IntervalSet} a
 * @param {IntervalSet} b
 * @return {boolean}
 */
IntervalSet.equals = function (a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.intervals.length != b.intervals.length) return false;
    return every(a.intervals, (interval, i) => interval.equals(b.intervals[i]));
};

/**
 * @type {IntervalSet}
 */
IntervalSet.COMPLETE_CHAR_SET = IntervalSet.of(Lexer.MIN_CHAR_VALUE, Lexer.MAX_CHAR_VALUE);
IntervalSet.COMPLETE_CHAR_SET.setReadonly(true);

/**
 * @type {IntervalSet}
 */
IntervalSet.EMPTY_SET = new IntervalSet();
IntervalSet.EMPTY_SET.setReadonly(true);


exports = IntervalSet;
