python lib/closure-library/closure/bin/calcdeps.py --path 'lib/closure-library/closure/goog' --path 'lib/closure-library/third_party/closure/goog' --path 'src' --input test.js --output_mode list > build/inputs.txt

java -jar ~/Downloads/compiler-latest/closure-compiler-v20190909.jar --compilation_level=SIMPLE_OPTIMIZATIONS --js_output_file=out.js --js='lib/closure-library/closure/goog' --js='lib/closure-library/third_party/closure/goog' --js='src' --js='!lib/closure-library/closure/goog/**_test.js'


CLEAN STUFF
MISC ----
org.antlr.v4.runtime.misc.IntSet
org.antlr.v4.runtime.misc.Interval
org.antlr.v4.runtime.misc.IntervalSet
org.antlr.v4.runtime.misc.Utils
org.antlr.v4.runtime.misc.Pair
org.antlr.v4.runtime.misc.MurmurHash

ATN ----
org.antlr.v4.runtime.atn.LexerAction
org.antlr.v4.runtime.atn.LexerMoreAction
org.antlr.v4.runtime.atn.LexerModeAction
org.antlr.v4.runtime.atn.LexerIndexedCustomAction
org.antlr.v4.runtime.atn.LexerActionExecutor
org.antlr.v4.runtime.atn.*Context
org.antlr.v4.runtime.atn.*Transition
org.antlr.v4.runtime.atn.*State
org.antlr.v4.runtime.atn.*ATNConfig
org.antlr.v4.runtime.atn.ATN
org.antlr.v4.runtime.atn.ATNConfigSet
org.antlr.v4.runtime.atn.*ATNSimulator
org.antlr.v4.runtime.atn.LL1Analyzer
org.antlr.v4.runtime.atn.ATNDeserializationOptions
org.antlr.v4.runtime.atn.DecisionEventInfo
org.antlr.v4.runtime.atn.AmbiguityInfo
org.antlr.v4.runtime.atn.ContextSensitivityInfo
org.antlr.v4.runtime.atn.ErrorInfo
org.antlr.v4.runtime.atn.LookaheadEventInfo

DFA ----
org.antlr.v4.runtime.dfa.DFAState
org.antlr.v4.runtime.dfa.DFA

TREE ----
org.antlr.v4.runtime.tree.SyntaxTree
org.antlr.v4.runtime.tree.ParseTree
org.antlr.v4.runtime.tree.RuleNode
org.antlr.v4.runtime.tree.TerminalNode
org.antlr.v4.runtime.tree.ErrorNode
org.antlr.v4.runtime.tree.TerminalNodeImpl
org.antlr.v4.runtime.tree.ErrorNodeImpl
org.antlr.v4.runtime.tree.ParseTreeWalker
org.antlr.v4.runtime.tree.ParseTreeListener

MAIN ----
org.antlr.v4.runtime.Lexer
org.antlr.v4.runtime.Parser
org.antlr.v4.runtime.RuleContext
org.antlr.v4.runtime.*Token
org.antlr.v4.runtime.TokenSource
org.antlr.v4.runtime.CommonTokenFactory
org.antlr.v4.runtime.*Stream
org.antlr.v4.runtime.Vocabulary
org.antlr.v4.runtime.VocabularyImpl
org.antlr.v4.runtime.ANTLRErrorListener
org.antlr.v4.runtime.BaseErrorListener
org.antlr.v4.runtime.ConsoleErrorListener
org.antlr.v4.runtime.Recognizer
org.antlr.v4.runtime.RecognitionException
org.antlr.v4.runtime.LexerNoViableAltException