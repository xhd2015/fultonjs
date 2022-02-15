"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseNext = parseNext;
exports.parseObject = parseObject;
exports.parseOne = parseOne;
exports.parseString = parseString;
exports.tryParse = tryParse;
Object.defineProperty(exports, "tryParseAll", {
  enumerable: true,
  get: function () {
    return _parser.tryParseAll;
  }
});

var _parser = require("./parser");

// interface ParseOptions {
// }
// primary entrance
function tryParse(s
/*,options?: ParseOptions*/
) {
  // currently options are ignored
  return (0, _parser.guess)(s);
}

function parseOne(s) {
  const parser = new _parser.Parser();
  return parser.parseNext(s, s.length, 0);
}

function parseNext(s, n, i) {
  const parser = new _parser.Parser();
  return parser.parseNext(s, n, i);
}

function parseString(s, n, i) {
  const parser = new _parser.Parser();
  return parser.parseString(s, n, i);
}

function parseObject(s, n, i) {
  const parser = new _parser.Parser();
  return parser.parseObject(s, n, i);
}