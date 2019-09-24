/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.misc.Predicate');
goog.module.declareLegacyNamespace();


/**
 * @template T
 * @interface
 */
class Predicate {
    /**
     * @param {T} t
     * @return {boolean}
     */
	test(t) {}
}


exports = Predicate;
