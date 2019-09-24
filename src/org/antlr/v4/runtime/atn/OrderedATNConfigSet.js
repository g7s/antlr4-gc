/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.OrderedATNConfigSet');
goog.module.declareLegacyNamespace();


const ATNConfigSet = goog.require('org.antlr.v4.runtime.atn.ATNConfigSet');
const Set = goog.require('org.antlr.v4.runtime.misc.Set');

/**
 *
 * @author Sam Harwell
 */
class OrderedATNConfigSet extends ATNConfigSet {
    constructor() {
        super();
        this.configLookup = new Set(
            (o) => o == null ? 0 : o.hashCode(),
            (o1, o2) => o1 == null ? o2 == null : o1.equals(o2));
	}
}


exports = OrderedATNConfigSet;
