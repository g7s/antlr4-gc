/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.misc.Map');


const {find, findIndex} = goog.require('goog.array');

/**
 * @template K, V
 */
class Map {
    /**
     * @param {function(K): number} hashFn
     * @param {function(K, K): boolean} eqFn
     */
    constructor(hashFn, eqFn) {
        /**
         * @protected {Object.<Array.<{key: K, value: V}>>}
         */
        this.data = {};
        /**
         * @protected {number}
         */
        this.len = 0;
        /**
         * @protected {function(K): number}
         */
        this.hashFn = hashFn || ((o) => o.hashCode());
        /**
         * @protected {function(K, K): boolean}
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
     * @param {K} key
     * @param {V} value
     * @return {V}
     */
    put(key, value) {
        var hashKey = this.hashFn(key);
        if (hashKey in this.data) {
            var entries = this.data[hashKey];
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                if (this.eqFn(key, entry.key)) {
                    var oldValue = entry.value;
                    entry.value = value;
                    return oldValue;
                }
            }
            entries.push({key: key, value: value});
        } else {
            this.data[hashKey] = [{key: key, value: value}];
        }
        this.len++;
        return value;
    }

    /**
     * @param {K} key
     * @return {boolean}
     */
    has(key) {
        return this.getEntry(key) !== null;
    }

    /**
     * @param {K} key
     * @return {V}
     */
    get(key) {
        var entry = this.getEntry(key);
        return entry && entry.value;
    }

    /**
     * @return {Array.<{key: K, value: V}>}
     */
    entries() {
        return this.mapEntries(e => e);
    }

    /**
     * @return {Array.<K>}
     */
    keys() {
        return this.mapEntries(e => e.key);
    }

    /**
     * @return {Array.<V>}
     */
    values() {
        return this.mapEntries(e => e.value);
    }

    /**
     * @param {K} key
     * @return {boolean}
     */
    delete(key) {
        var hkey = this.hashFn(key);
        var idx = findIndex(this.data[hkey] || [], (e) => this.eqFn(key, e.key), this);
        var r = idx >= 0;
        if (r) {
            this.data[hkey].splice(idx, 1);
            this.len--;
        }
        return r;
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
        /**
         * @type {Array.<string>}
         */
        var ss = this.mapEntries(e => '{' + e.key + ':' + e.value + '}');
        return '[' + ss.join(", ") + ']';
    }

    /**
     * @private
     * @param {K} key
     * @return {{key: K, value: V}}
     */
    getEntry(key) {
        return find(this.data[this.hashFn(key)] || [], (e) => this.eqFn(key, e.key), this);
    }

    /**
     * @private
     * @template T
     * @param {function({key: K, value: V}): T} fn
     * @return {Array.<T>}
     */
    mapEntries(fn) {
        var l = [];
        for (var key in this.data) {
            l = l.concat(this.data[key].map(fn));
        }
        return l;
    }
}


exports = Map;
