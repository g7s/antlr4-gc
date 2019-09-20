/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.StarLoopEntryState');


const DecisionState = goog.require('org.antlr.v4.runtime.atn.DecisionState');
const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');

class StarLoopEntryState extends DecisionState {
    constructor() {
        super();
        /**
         * @type {org.antlr.v4.runtime.atn.StarLoopbackState}
         */
        this.loopBackState = null;
        /**
         * Indicates whether this state can benefit from a precedence DFA during SLL
         * decision making.
         *
         * <p>This is a computed property that is calculated during ATN deserialization
         * and stored for use in {@link ParserATNSimulator} and
         * {@link ParserInterpreter}.</p>
         *
         * @type {boolean}
         * @see DFA#isPrecedenceDfa()
         */
        this.isPrecedenceDecision = false;
    }

	getStateType() {
		return ATNState.STAR_LOOP_ENTRY;
	}
}


exports = StarLoopEntryState;
