/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.AbstractPredicateTransition');
goog.module.declareLegacyNamespace();


const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');

/**
 * @author Sam Harwell
 *
 * @abstract
 */
class AbstractPredicateTransition extends Transition {
    /**
     * @param {org.antlr.v4.runtime.atn.ATNState} target
     */
	constructor(target) {
		super(target);
	}
}


exports = AbstractPredicateTransition;
