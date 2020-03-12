# ANTLR4 JavaScript runtime
This is an unofficial ANTLR4 runtime for JavaScript. The main difference with the official one is that this runtime is written 
with [Google closure compiler](https://developers.google.com/closure/compiler) compatible code. It is an almost direct rewrite 
of the Java runtime and it reports an ~ 98% coverage regarding type checking.

**DISCLAIMER**

As there are currently no tests that check how this runtime behaves I do not recommend using it in production code.

## WHY?
The need for this came when I was working on a project that used Clojure(Script) and I wanted to re-use code written with
ANTLR4 Java runtime in JavaScript which was impossible with the current JavaScript runtime, plus I wanted all the benefits
of the Google closure compiler. 

## Google Closure ANTLR4 target
For this to work you will probably need a new ANTLR4 target that will generate the parser and the lexer with code compatible
with this runtime. I have a branch in [my ANTLR4 fork](https://github.com/g7s/antlr4/tree/closure) that does that.

## CONTRIBUTING
Because currently there are no tests I would really like to have someone more experienced than me with ANTLR4 help with tests.
I have tested it with some (not so trivial) grammars but no automated tests yet.

## LICENSE
The same as ANTLR4 (I guess?)
