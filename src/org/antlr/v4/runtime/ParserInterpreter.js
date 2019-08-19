/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.ParserInterpreter');

/*
import org.antlr.v4.runtime.atn.ATN;
import org.antlr.v4.runtime.atn.ATNState;
import org.antlr.v4.runtime.atn.ActionTransition;
import org.antlr.v4.runtime.atn.AtomTransition;
import org.antlr.v4.runtime.atn.DecisionState;
import org.antlr.v4.runtime.atn.LoopEndState;
import org.antlr.v4.runtime.atn.ParserATNSimulator;
import org.antlr.v4.runtime.atn.PrecedencePredicateTransition;
import org.antlr.v4.runtime.atn.PredicateTransition;
import org.antlr.v4.runtime.atn.PredictionContextCache;
import org.antlr.v4.runtime.atn.RuleStartState;
import org.antlr.v4.runtime.atn.RuleTransition;
import org.antlr.v4.runtime.atn.StarLoopEntryState;
import org.antlr.v4.runtime.atn.Transition;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.misc.Pair;

import java.util.ArrayDeque;
import java.util.Collection;
import java.util.Deque;
*/

const ATN = goog.require('org.antlr.v4.runtime.atn.ATN');
const ATNState = goog.require('org.antlr.v4.runtime.atn.ATNState');
const ActionTransition = goog.require('org.antlr.v4.runtime.atn.ActionTransition');
const DecisionState = goog.require('org.antlr.v4.runtime.atn.DecisionState');
const LoopEndState = goog.require('org.antlr.v4.runtime.atn.LoopEndState');
const ParserATNSimulator = goog.require('org.antlr.v4.runtime.atn.ParserATNSimulator');
const PrecedencePredicateTransition = goog.require('org.antlr.v4.runtime.atn.PrecedencePredicateTransition');
const PredicateTransition = goog.require('org.antlr.v4.runtime.atn.PredicateTransition');
const RuleStartState = goog.require('org.antlr.v4.runtime.atn.RuleStartState');
const RuleTransition = goog.require('org.antlr.v4.runtime.atn.RuleTransition');
const StarLoopEntryState = goog.require('org.antlr.v4.runtime.atn.StarLoopEntryState');
const Transition = goog.require('org.antlr.v4.runtime.atn.Transition');
const DFA = goog.require('org.antlr.v4.runtime.dfa.DFA');
const Pair = goog.require('org.antlr.v4.runtime.misc.Pair');

