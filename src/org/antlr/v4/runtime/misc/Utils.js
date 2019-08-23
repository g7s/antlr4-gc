/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.misc.Utils');


/**
 * @param {string} s
 * @param {boolean} escapeSpaces
 * @return {string}
 */
function escapeWhitespace(s, escapeSpaces) {
    s = s.replace(/\t/g, "\\t")
         .replace(/\n/g, "\\n")
         .replace(/\r/g, "\\r");
    if (escapeSpaces) {
        s = s.replace(/ /g, "\u00B7");
    }
    return s;
}

/**
 * @param {Array.<string>} as
 * @return {Object.<number>}
 */
function toMap(as) {
    /**
     * @type {Object.<number>}
     */
    var ret = {};
    as.forEach((s, i) => {
        ret[s] = i;
    });
    return ret;
}


exports = {
    escapeWhitespace,
    toMap
};
