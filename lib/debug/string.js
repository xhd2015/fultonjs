"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.capitalize = capitalize;
exports.countLines = countLines;
exports.escapeHTMLText = escapeHTMLText;
exports.escapeShell = escapeShell;
exports.flattenSplit = flattenSplit;
exports.format = format;
exports.indentLines = indentLines;
exports.interpolation = interpolation;
exports.isEmpty = isEmpty;
exports.isNotEmpty = isNotEmpty;
exports.isNumeric = isNumeric;
exports.isNumericString = isNumericString;
exports.isPositive = isPositive;
exports.joinByOneSep = joinByOneSep;
exports.removeSuiffx = removeSuiffx;

var _core = require("@babel/core");

var _util = _interopRequireDefault(require("util"));

var objpath = _interopRequireWildcard(require("./objpath"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// join by one sep
// 'a/' + '/b' => 'a/b'
function joinByOneSep(a, b, sep) {
  if (!a) {
    return b;
  }

  if (!b) {
    return a;
  }

  let aHasSep = a.endsWith(sep);
  let bHasSep = b.startsWith(sep);

  if (aHasSep && bHasSep) {
    return a.slice(0, a.length - 1) + b;
  } else if (!aHasSep && !bHasSep) {
    return a + sep + b;
  } else {
    return a + b;
  }
}

function countLines(s) {
  let i = -1;
  let cnt = 1;

  while ((i = s.indexOf("\n", i + 1)) !== -1) {
    cnt++;
  }

  return cnt;
}

function indentLines(s, prefix) {
  if (!prefix) {
    return s;
  }

  return s.split("\n").map(e => prefix + e).join("\n");
}

function removeSuiffx(s, suffix) {
  if (s && suffix && s.endsWith(suffix)) {
    return s.slice(0, s.length - suffix.length);
  }

  return s;
}

function format(format, ...args) {
  return _util.default.format(format, ...args);
}

function capitalize(s) {
  if (!s || !s[0]) {
    return s;
  }

  return s[0].toUpperCase() + s.slice(1);
}

function findNextOpenClosePair(s, start) {
  let open = start;
  let close = -1;
  let escapes = [];

  while ((open = s.indexOf("${", open)) !== -1) {
    if (open > 0 && s[open - 1] === '\\') {
      // escaped, should be recovered
      escapes.push(open - 1);
      continue;
    }

    close = s.indexOf("}", open + 2);

    if (close === -1) {
      break; // not found
    }

    if (close === open + 2 || close === open + 3 && s[close - 1] === '!') {
      // empty
      open = close + 1;
      continue;
    }

    break;
  }

  return [open, close, escapes];
} // support syntax:  ${something}, ${something!}
// suffix ! means if value is null, the original template is kept
// do not support nested
// example:  interpolation("adsfa:${a},b:${b!}",{a:1})
//           =>
//           adsfa:1,b:${b!}


function interpolation(template, ...ctx) {
  if (!template || !template.includes("${")) {
    return template;
  } // parse all placeholders


  let parts = [];
  let i = 0; // loop invariant:  i is at begining of next search

  while (true) {
    // must have escapes[any] < open
    let [open, close, escapes] = findNextOpenClosePair(template, i); // process escapes

    let escStart = i;

    for (let escEnd of escapes) {
      parts.push(escStart, escEnd); // exclude escEnd

      escStart = escEnd + 1;
    }

    if (open === -1 || close === -1) {
      parts.push(template.slice(i));
      break;
    }

    open -= escapes.length; // removed

    close -= escapes.length;
    parts.push(template.slice(i, open));
    let segment = template.slice(open + 2, close);
    let must = false;

    if (segment.endsWith("!")) {
      must = true;
      segment = segment.slice(0, segment.length - 1);
    }

    parts.push({
      key: segment,
      must
    });
    i = close + 1;
  } // parts is compiled, now combine them


  return parts.map(e => {
    if (typeof e === 'string') {
      return e;
    } // read from all


    let value;

    for (let c of ctx) {
      value = objpath.get(c, e.key);

      if (value != null) {
        break;
      }
    }

    if (value == null) {
      if (e.must) {
        value = "${" + e.key + "!}"; // throw new Error("cannot get " + key)
      } else {
        value = "";
      }
    }

    return value;
  }).join("");
} // flatten split: 
//  if s is string, split s with separator and return
//  if s is array of string, every string in array is splitted and flatten to array
// example:
//   "a" => ["a"]
//   "a,b" => ["a","b"]
//   ["a,b","c,d"] => ["a","b","c","d"]
// options: {trim:true(default), ignoreEmpty:true(default)}
// usage scenerio:   parse the http query parameter


function flattenSplit(s, separator = ",", options) {
  let {
    trim = true,
    ignoreEmpty = true
  } = options || {};
  let result = []; // typeof e === 'string'

  function splitString(e) {
    if (e == null) {
      return;
    }

    let tp = typeof e;

    if (tp !== 'string') {
      if (tp !== 'number' || !isNaN(e)) {
        result.push(e);
      }

      return;
    }

    let it = e.split(separator, -1);

    if (trim) {
      it = it.map(e => e.trim());
    }

    if (ignoreEmpty) {
      it = it.filter(e => e);
    }

    result.push(...it);
  }

  if (Array.isArray(s)) {
    for (let e of s) {
      splitString(e);
    }
  } else {
    splitString(s);
  }

  return result;
} // escape string


function escapeShell(word) {
  word = word || '';
  let idx = word.indexOf("'");

  if (idx != -1) {
    word = word.replace("'", "'\\''"); // escape the ' with \'
  }

  return "'" + word + "'";
}

function escapeHTMLText(s) {
  if (!s) {
    return s;
  }

  let h = '';

  for (let i = 0; i < s.length; i++) {
    let c = s[i];

    switch (s[i]) {
      case '\n':
        c = '<br/>';
        break;

      case ' ':
        c = '&nbsp;';
        break;

      case '&':
        c = '&amp;';
        break;
    }

    h += c;
  }

  return h;
}

function isEmpty(v) {
  // 0 == '' ==> true
  return v == null || v === "";
}

function isNotEmpty(v) {
  // 0 == '' ==> true
  return !isEmpty(v);
} // positive: true => positive
//           false => negative
//           undefined => no sign requirement


function isNumeric(v, positive) {
  if (v == null || v === '') {
    return false;
  }

  let valueType = typeof v;

  if (valueType === 'string') {
    return isStringAndNumeric(v, positive);
  }

  if (valueType === 'number') {
    if (isNaN(v) || v === Infinity || v === -Infinity) {
      return false;
    }

    if (positive === true) {
      return v > 0;
    } else if (positive === false) {
      return v < 0;
    }

    return true;
  }

  return false;
}

function isNumericString(s, positive) {
  if (typeof s !== 'string' || s === '') {
    return false;
  }

  return isStringAndNumeric(s, positive);
} // s: not empty
// Number("0098") => 98


function isStringAndNumeric(s, positive) {
  let idx = 0;

  if (s.startsWith("+")) {
    if (positive === false) {
      return false;
    }

    idx = 1;
  } else if (s.startsWith("-")) {
    if (positive === true) {
      return false;
    }

    idx = 1;
  } else {
    if (positive === false) {
      return false;
    }
  }

  if (idx === s.length) {
    return false;
  }

  for (; idx < s.length; idx++) {
    const c = s[idx];

    if (c < '0' || c > '9') {
      return false;
    }
  }

  return true;
}

function isPositive(v) {
  return isNumeric(v, true);
}