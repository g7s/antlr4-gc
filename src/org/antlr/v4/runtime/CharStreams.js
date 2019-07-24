/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.CharStreams');


const ANTLRInputStream = goog.require('org.antlr.v4.runtime.ANTLRInputStream');
const fs = require('fs');

/** This module represents the primary interface for creating {@link CharStream}s
 *  from a variety of sources as of 4.7.  The motivation was to support
 *  Unicode code points > U+FFFF.  {@link ANTLRInputStream} and
 *  {@link ANTLRFileStream} are now deprecated in favor of the streams created
 *  by this interface.
 *
 *  DEPRECATED: {@code new ANTLRFileStream("myinputfile")}
 *  NEW:        {@code CharStreams.fromFileName("myinputfile")}
 *
 *  WARNING: If you use both the deprecated and the new streams, you will see
 *  a nontrivial performance degradation. This speed hit is because the
 *  {@link Lexer}'s internal code goes from a monomorphic to megamorphic
 *  dynamic dispatch to get characters from the input stream. Java's
 *  on-the-fly compiler (JIT) is unable to perform the same optimizations
 *  so stick with either the old or the new streams, if performance is
 *  a primary concern. See the extreme debugging and spelunking
 *  needed to identify this issue in our timing rig:
 *
 *      https://github.com/antlr/antlr4/pull/1781
 *
 *  The ANTLR character streams still buffer all the input when you create
 *  the stream, as they have done for ~20 years. If you need unbuffered
 *  access, please note that it becomes challenging to create
 *  parse trees. The parse tree has to point to tokens which will either
 *  point into a stale location in an unbuffered stream or you have to copy
 *  the characters out of the buffer into the token. That defeats the purpose
 *  of unbuffered input. Per the ANTLR book, unbuffered streams are primarily
 *  useful for processing infinite streams *during the parse.*
 *
 *  The new streams also use 8-bit buffers when possible so this new
 *  interface supports character streams that use half as much memory
 *  as the old {@link ANTLRFileStream}, which assumed 16-bit characters.
 *
 *  A big shout out to Ben Hamilton (github bhamiltoncx) for his superhuman
 *  efforts across all targets to get true Unicode 3.1 support for U+10FFFF.
 *
 *  @since 4.7
 */

/**
 * Creates an ANTLRInputStream from a string.
 * @params {string} str
 * @return {ANTLRInputStream}
 */
exports.fromString = function (str) {
    return new ANTLRInputStream(str, true);
};

/**
 * Asynchronously creates an ANTLRInputStream from a blob given the
 * encoding of the bytes in that blob (defaults to 'utf8' if encoding is null).
 * Invokes onLoad(result) on success, onError(error) on failure.
 *
 * @param {Blob} blob
 * @param {?string} encoding
 * @param {Function} onLoad
 * @param {Function=} onError
 * @return {void}
 */
exports.fromBlob = function (blob, encoding, onLoad, onError) {
  var reader = FileReader();
  reader.onload = function (e) {
    onLoad(new ANTLRInputStream(e.target.result, true));
  };
  reader.onerror = onError || function () {};
  reader.readAsText(blob, encoding);
};

/**
 * Creates an ANTLRInputStream from a Buffer given the
 * encoding of the bytes in that buffer (defaults to 'utf8' if encoding is null).
 *
 * @param {Buffer} buffer
 * @param {?string} encoding
 * @return {ANTLRInputStream}
 */
exports.fromBuffer = function (buffer, encoding) {
  return new ANTLRInputStream(buffer.toString(encoding), true);
};

/**
 * Asynchronously creates an ANTLRInputStream from a file on disk given
 * the encoding of the bytes in that file (defaults to 'utf8' if
 * encoding is null).
 * Invokes callback(error, result) on completion.
 *
 * @param {string} path
 * @param {?string} encoding
 * @param {Function} callback
 * @return {void}
 */
exports.fromPath = function (path, encoding, callback) {
  fs.readFile(path, encoding, function (err, data) {
    callback(err, data !== null ? null : new ANTLRInputStream(data, true));
  });
};

/**
 * Synchronously creates an ANTLRInputStream given a path to a file
 * on disk and the encoding of the bytes in that file (defaults to
 * 'utf8' if encoding is null).
 *
 * @param {string} path
 * @param {?string} encoding
 * @return {ANTLRInputStream}
 */
exports.fromPathSync = function (path, encoding) {
  var data = fs.readFileSync(path, encoding);
  return new ANTLRInputStream(data, true);
};
