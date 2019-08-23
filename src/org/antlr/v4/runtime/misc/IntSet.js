/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.misc.IntSet');


/**
 * A generic set of integers.
 *
 * @interface
 * @see IntervalSet
 */
class IntSet {
	/**
	 * Adds the specified value to the current set.
	 *
	 * @param {number} el the value to add
	 * @return {void}
	 * @exception IllegalStateException if the current set is read-only
	 */
	add(el) {}

	/**
	 * Modify the current {@link IntSet} object to contain all elements that are
	 * present in itself, the specified {@code set}, or both.
	 *
	 * @param {IntSet} set The set to add to the current set. A {@code null} argument is
	 * treated as though it were an empty set.
	 * @return {IntSet} {@code this} (to support chained calls)
	 *
	 * @exception IllegalStateException if the current set is read-only
	 */
	addAll(set) {}

	/**
	 * Return a new {@link IntSet} object containing all elements that are
	 * present in both the current set and the specified set {@code a}.
	 *
	 * @param {IntSet} a The set to intersect with the current set. A {@code null}
	 * argument is treated as though it were an empty set.
	 * @return {IntSet} A new {@link IntSet} instance containing the intersection of the
	 * current set and {@code a}. The value {@code null} may be returned in
	 * place of an empty result set.
	 */
	and(a) {}

	/**
	 * Return a new {@link IntSet} object containing all elements that are
	 * present in {@code elements} but not present in the current set. The
	 * following expressions are equivalent for input non-null {@link IntSet}
	 * instances {@code x} and {@code y}.
	 *
	 * <ul>
	 * <li>{@code x.complement(y)}</li>
	 * <li>{@code y.subtract(x)}</li>
	 * </ul>
	 *
	 * @param {IntSet} elements The set to compare with the current set. A {@code null}
	 * argument is treated as though it were an empty set.
	 * @return {IntSet} A new {@link IntSet} instance containing the elements present in
	 * {@code elements} but not present in the current set. The value
	 * {@code null} may be returned in place of an empty result set.
	 */
	complement(elements) {}

	/**
	 * Return a new {@link IntSet} object containing all elements that are
	 * present in the current set, the specified set {@code a}, or both.
	 *
	 * <p>
	 * This method is similar to {@link #addAll(IntSet)}, but returns a new
	 * {@link IntSet} instance instead of modifying the current set.</p>
	 *
	 * @param {IntSet} a The set to union with the current set. A {@code null} argument
	 * is treated as though it were an empty set.
	 * @return {IntSet} A new {@link IntSet} instance containing the union of the current
	 * set and {@code a}. The value {@code null} may be returned in place of an
	 * empty result set.
	 */
	or(a) {}

	/**
	 * Return a new {@link IntSet} object containing all elements that are
	 * present in the current set but not present in the input set {@code a}.
	 * The following expressions are equivalent for input non-null
	 * {@link IntSet} instances {@code x} and {@code y}.
	 *
	 * <ul>
	 * <li>{@code y.subtract(x)}</li>
	 * <li>{@code x.complement(y)}</li>
	 * </ul>
	 *
	 * @param {IntSet} a The set to compare with the current set. A {@code null}
	 * argument is treated as though it were an empty set.
	 * @return {IntSet} A new {@link IntSet} instance containing the elements present in
	 * {@code elements} but not present in the current set. The value
	 * {@code null} may be returned in place of an empty result set.
	 */
    subtract(a) {}

	/**
	 * Return the total number of elements represented by the current set.
	 *
	 * @return {number} the total number of elements represented by the current set,
	 * regardless of the manner in which the elements are stored.
	 */
	size() {}

	/**
	 * Returns {@code true} if this set contains no elements.
	 *
	 * @return {boolean} {@code true} if the current set contains no elements; otherwise,
	 * {@code false}.
	 */
	isNil() {}

	/**
     * @param {Object} obj
	 * @return {boolean}
	 */
	equals(obj) {}

	/**
	 * Returns {@code true} if the set contains the specified element.
	 *
	 * @param {number} el The element to check for.
	 * @return {boolean} {@code true} if the set contains {@code el}; otherwise {@code false}.
	 */
	contains(el) {}

	/**
	 * Removes the specified value from the current set. If the current set does
	 * not contain the element, no changes are made.
	 *
	 * @param {number} el the value to remove
	 * @return {void}
     *
	 * @exception IllegalStateException if the current set is read-only
	 */
	remove(el) {}

	/**
	 * Return a list containing the elements represented by the current set. The
	 * list is returned in ascending numerical order.
	 *
	 * @return {Array.<number>} A list containing all element present in the current set, sorted
	 * in ascending numerical order.
	 */
	toList() {}

	/**
	 * @return {string}
	 */
	toString() {}
}