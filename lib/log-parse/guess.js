"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.guessLogOptions = guessLogOptions;
exports.guessOptions = guessOptions;
exports.tryExtractAll = tryExtractAll;
exports.tryExtractAllWithDetail = tryExtractAllWithDetail;
exports.tryExtractByLookingPrefix = tryExtractByLookingPrefix;
exports.tryExtractByStartingFromKV = tryExtractByStartingFromKV;
exports.tryParseReqOption = tryParseReqOption;

var _char = require("../char");

var _debugUtil = require("../debug-util");

var _parser = require("./parser");

const debug = (0, _debugUtil.makeDebug)(true);

function guessOptionByColon(s) {} // some word, like: 'req:...',  we may consider after 'req:' is our complete log


function guessByLookingIdentifyingWord(s) {} // guess the log by looking ahead some key information


function guessLogOptions(s) {
  if (!s) {
    return [];
  }

  const opts = []; // first, try Service Called Request

  const reqOptions = tryParseReqOption(s); // if reqOptions present, then we think this is a strong hint
  // that cannot be overridden, so we just use it

  if (reqOptions) {
    opts.push({
      category: 'Service Called Reqeust',
      serviceCalledRequestOptions: reqOptions
    });
    return opts;
  }

  return opts;
} // example: 2022-02-15 09:25:23.428439      [2872de99a4b8064d4ae5480b2bf6fe74] [INFO]       [rpc_log_wrapper.go/86: 1] Service Called Request: {serviceName:PayReadManager.QueryConfirmTime, clientHost:100.95.111.48, clientService:credit.funding.platform, req:credit_user_id:1008104115 loan_id:"2021120918373811008104115000101639018228078" }


function tryParseReqOption(s) {
  if (!s) {
    return null;
  }

  const idx = s.indexOf("Service Called Request:");

  if (idx < 0) {
    return null;
  }

  const reqIdx = s.indexOf("req:", idx);

  if (reqIdx < 0) {
    return null;
  }

  return {
    reqObjectStart: reqIdx + "req:".length
  };
} // simple strategy:
//     
// actaully, we can also lex parsing the input.
//   by shifting something we may finally get a refined log
// actaully, log is to
// extract something that is ok
// we have different strategies:
//  1. count how many ':' appears
//  2. count how many , appears
//  3. count how many 


function guessOptions(s) {
  if (!s) {
    return [];
  }

  const opts = []; // first kv
  // a:1213 c:214321

  let i = s.indexOf(':');

  if (i > 0) {
    const kvOpt = {
      category: '',
      fieldSep: [],
      kvSep: ':',
      stringWithQuote: 'possible'
    };

    if (s[i + 1] === ' ') {
      i++;
    } // some thing like: a:kvad


    if (s[i + 1] !== '"' && s[i + 1] !== '\'' && !(0, _char.isDigit)(s[i + 1])) {
      kvOpt.stringWithQuote = false;
    }

    if (s[i + 1] === '"' || s[i + 1] === '\'') {
      kvOpt.stringWithQuote = true;
    } // find next :


    let nextKvIdx = s.indexOf(':', i + 1);

    if (nextKvIdx > 0) {
      if (s[nextKvIdx - 1] === ' ') {
        nextKvIdx--;
      }

      for (let j = nextKvIdx - 1; j > i; j--) {
        if ((0, _char.isLetter)(s[j]) || s[j] === '_') {
          continue;
        } // first non-word character


        if (s[j] === ' ') {
          kvOpt.fieldSep.push(' ');
        } else if (s[j] === ',') {
          kvOpt.fieldSep.push(',');
        }

        break;
      } // before a key

    }

    opts.push(kvOpt);
  }

  return opts;
} // try to parse all possibly object


function tryExtractAll(s, opts) {
  const details = tryExtractAllWithDetail(s);
  return details.map(e => e.object);
}

function tryExtractAllWithDetail(s, opts) {
  var _a;

  if (!s) {
    return [];
  }

  const items = [];
  const wantObject = (opts === null || opts === void 0 ? void 0 : opts.wantObject) !== false;

  if (((_a = opts === null || opts === void 0 ? void 0 : opts.lookingPrefix) === null || _a === void 0 ? void 0 : _a.length) > 0) {
    for (let opt of opts.lookingPrefix) {
      if (!opt) {
        continue;
      }

      let prefix = '';
      let autoObjectBrace = false;
      let parseOptions;

      if (typeof opt === 'string') {
        prefix = opt;
      } else {
        prefix = opt.prefix;
        autoObjectBrace = opt.autoObjectBrace;
        parseOptions = opt.options;
      }

      let i = s.indexOf(prefix);

      if (i >= 0) {
        let part = s.slice(i + prefix.length);
        let usedPart = part;

        if (autoObjectBrace) {
          if (usedPart[0] !== '{') {
            usedPart = '{' + usedPart;
          }

          if (usedPart[usedPart.length - 1] !== '}') {
            usedPart = usedPart + '}';
          }
        }

        if (parseOptions) {
          try {
            const parsed = new _parser.Parser(parseOptions).parse(usedPart);

            if (parsed) {
              items.push({
                text: part,
                object: parsed.value,
                type: parsed.type
              });
            }
          } catch (e) {}
        } else {
          const parsedItems = tryExtractByStartingFromKV(usedPart);
          items.push(...parsedItems);
        }
      }
    }
  } else {
    if (wantObject) {}
  }

  return items;
} // this strategy simple locate to some prefix, and do a strict parse


function tryExtractByLookingPrefix(s) {
  return [];
} // this strategy simple locate to some prefix, and do a strict parse


function tryExtractByStartingFromKV(s) {
  debug('tryExtractByStartingFromKV:', s); // look for `:"`, means it is a key value pair

  const n = s.length;
  let col = 0;
  let colDoubleQuote = 0; // count of :"

  let colDigit = 0; // count :1

  let colWord = 0; // :xx

  let doubleQuoteSpace = 0; // count of "[space]

  let doubleQuoteComma = 0; // count of ",

  let digitSpace = 0;
  let digitComma = 0;
  let wordSpace = 0;
  let wordComma = 0;

  for (let i = 0; i < n; i++) {
    if (s[i] === ':') {
      col++;

      if (s[i + 1] === '"') {
        colDoubleQuote++;
      } else if ((0, _char.isDigit)(s[i + 1])) {
        colDigit++;
      } else if ((0, _char.isWord)(s[i + 1])) {
        colWord++;
      }
    } else if (s[i] === '"') {
      if (s[i + 1] === ",") {
        doubleQuoteComma++;
      }

      if (s[i + 1] === ' ') {
        doubleQuoteSpace++;
      }
    } else if ((0, _char.isDigit)(s[i])) {
      if (s[i + 1] === ',') {
        digitComma++;
      }

      if (s[i + 1] === ' ') {
        digitSpace++;
      }
    } else if ((0, _char.isWord)(s[i])) {
      if (s[i + 1] === ',') {
        wordComma++;
      }

      if (s[i + 1] === ' ') {
        wordSpace++;
      }
    }
  }

  let kvSep = ":";
  let stringQuoted = false;
  let fieldSep = " "; // at least half

  if (colDoubleQuote > 0 && colDoubleQuote / (colDoubleQuote + colWord) >= 0.5 && (colDoubleQuote + colDigit + colWord) / col > 0.5) {
    stringQuoted = true;
  }

  let endingComma = doubleQuoteComma + wordComma;
  let endingSpace = doubleQuoteSpace + wordSpace;

  if ((endingSpace + 1) / (endingComma + 1) > 0.6) {
    // is space
    fieldSep = " ";
  } else if ((endingComma + 1) / (endingSpace + 1) > 0.6) {
    fieldSep = ",";
  } else if (endingComma > endingSpace) {
    fieldSep = ",";
  } else {
    fieldSep = " ";
  }

  const parser = new _parser.Parser({
    category: '',
    kvSep,
    fieldSep: fieldSep ? [fieldSep] : [],
    stringWithQuote: stringQuoted,
    arrayBeginChar: '[',
    arrayEndChar: ']',
    objectBeginChar: '{',
    objectEndChar: '}'
  });
  const items = []; // try parse

  try {
    const o = parser.parse(s);
    debug("parsed object:", o);
    items.push({
      text: s,
      object: o.value,
      type: o.type
    });
  } catch (e) {
    console.error("try parse failed:", e);
  } finally {}

  debug("col effective:", {
    kvSep,
    stringQuoted,
    fieldSep
  }); // stats: {
  //     col: 25,
  //     colDoubleQuote: 9,
  //     colDigit: 11,
  //     colWord: 2,
  //     doubleQuoteSpace: 9,
  //     doubleQuoteComma: 0,
  //     digitSpace: 5,
  //     digitComma: 0
  //   }

  debug("stats:", {
    col,
    colDoubleQuote,
    colDigit,
    colWord,
    doubleQuoteSpace,
    doubleQuoteComma,
    digitSpace,
    digitComma,
    wordSpace,
    wordComma
  });
  return items;
}