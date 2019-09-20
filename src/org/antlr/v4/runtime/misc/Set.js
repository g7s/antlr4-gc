/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.misc.Set');


const {find} = goog.require('goog.array');

/**
 * @template T
 */
class Set {
    /**
     * @param {(function(T): number)=} hashFn
     * @param {(function(T, T): boolean)=} eqFn
     */
    constructor(hashFn, eqFn) {
        /**
         * @protected {Object}
         */
        this.data = {};
        /**
         * @protected {number}
         */
        this.len = 0;
        /**
         * @protected {function(T): number}
         */
        this.hashFn = hashFn || ((o) => o.hashCode());
        /**
         * @protected {function(T, T): boolean}
         */
        this.eqFn = eqFn || ((k1, k2) => k1.equals(k2));
    }

    /**
     * @return {number}
     */
    get length() {
        return this.len;
    }

    /**
     * @return {number}
     */
    size() {
        return this.len;
    }

    /**
     * @return {boolean}
     */
    isEmpty() {
        return this.len === 0;
    }

    /**
     * @param {T} value
     * @return {boolean}
     */
    add(value) {
        var key = this.hashFn(value);
        if (key in this.data) {
            var values = this.data[key];
            for (var i = 0; i < values.length; i++) {
                var v = values[i];
                if (this.eqFn(value, v)) {
                    return false;
                }
            }
            values.push(value);
        } else {
            this.data[key] = [value];
        }
        this.len++;
        return true;
    }

    /**
     * @param {T} value
     * @return {?T}
     */
    get(value) {
        return find(this.data[this.hashFn(value)] || [], (e) => this.eqFn(value, e), this) || null;
    }

    /**
     * @param {T} value
     * @return {boolean}
     */
    contains(value) {
        return this.get(value) != null;
    }

    /**
     * @return {Array<T>}
     */
    values() {
        var l = [];
        for (var key in this.data) {
            l = l.concat(this.data[key]);
        }
        return l;
    }

    /**
     * @return {void}
     */
    clear() {
        this.data = {};
        this.len = 0;
    }

    /**
     * @return {string}
     */
    toString() {
        return '[' + this.values().join(", ") + ']';
    }
}


exports = Set;
