"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseJSONSafeBigint = parseJSONSafeBigint;
exports.prettyJSON = prettyJSON;
exports.prettyObject = prettyObject;
exports.stringifyJSONSafeBigint = stringifyJSONSafeBigint;
exports.tryParseJSON = tryParseJSON;
exports.tryParseJSONSafeBigint = tryParseJSONSafeBigint;

var _jsonBigint = _interopRequireDefault(require("json-bigint"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// useNativeBigInt: use builtin BigInt
// storeAsString: when big int encountered, use string
const JSONUtilBigint = (0, _jsonBigint.default)({
  useNativeBigInt: true
});
const JSONUtilString = (0, _jsonBigint.default)({
  useNativeBigInt: true,
  storeAsString: true
});

function tryParseJSON(json, defaultVaue) {
  if (json && typeof json === 'string') {
    try {
      return JSON.parse(json);
    } catch (e) {// ignore
    }
  }

  return defaultVaue;
}

function tryParseJSONSafeBigint(json, defaultVaue) {
  if (json && typeof json === 'string') {
    try {
      return parseJSONSafeBigint(json);
    } catch (e) {// ignore
    }
  }

  return defaultVaue;
} // options = {}


function parseJSONSafeBigint(json, ...options) {
  return JSONUtilString.parse(json, ...options);
}

function stringifyJSONSafeBigint(object, ...options) {
  return JSONUtilString.stringify(object, ...options);
} // pretty the content


function prettyJSON(content) {
  if (content) {
    return JSONUtilBigint.stringify(JSONUtilBigint.parse(content), undefined, "    ");
  }

  return content;
}

function prettyObject(object) {
  return JSONUtilBigint.stringify(object, undefined, "    ");
}