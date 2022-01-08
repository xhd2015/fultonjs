"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseNext = parseNext;
exports.parseObject = parseObject;
exports.parseOne = parseOne;
exports.parseString = parseString;
exports.tryParseAll = tryParseAll;
const isDebug = false; // const isDebug = true;

function debug() {
  if (!isDebug) {
    return;
  }

  console.log("DEBUG ", ...arguments);
}

function tryParseAll(s) {
  const objs = [];
  const n = s.length;

  for (let i = 0; i < n; i++) {
    if (s[i] !== '{') {
      continue;
    }

    debug(`START AT:${i}, ${s.slice(i, i + 20)}`);

    try {
      const {
        type,
        value,
        next
      } = parseObject(s, n, i);
      i = next - 1;
      objs.push(value);
    } catch (e) {
      // ignore
      debug(e); // console.error(e)
    }
  }

  return objs;
}

function parseOne(s) {
  return parseNext(s, s.length, 0);
}

function parseNext(s, n, i) {
  for (let j = i; j < n; j++) {
    switch (s[j]) {
      case '"':
      case '\'':
        return parseString(s, n, j);

      case '{':
        return parseObject(s, n, j);

      case '<':
        return parseArray(s, n, j);

      default:
        if (s[j] >= '0' && s[j] <= '9') {
          return parseNumber(s, n, j);
        }

        throw new Error("unknow type:" + s.slice(i, j + 1));
    }
  }
}

function parseString(s, n, i) {
  const b = s[i];

  if (b !== '"' && b !== '\'') {
    throw new Error(`invalid string begin,expect '",found ${b}`);
  }

  let buffers = []; // node has Buffer, browser has Int8Array

  function allocBuf(n) {
    if (typeof Buffer !== 'undefined') {
      // nodejs
      return Buffer.alloc(n);
    }

    return new Uint8Array(n);
  }

  function writeStrToBuf(buf, idx, str) {
    if (typeof Buffer !== 'undefined') {
      // nodejs
      return buf.write(str, idx, 'utf-8');
    }

    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);

    for (let i = 0; i < bytes.length; i++) {
      buf[idx + i] = bytes[i];
    }

    return bytes.length;
  }

  function writeUint8ToBuf(buf, idx, d) {
    if (typeof Buffer !== 'undefined') {
      // nodejs
      return buf.writeUInt8(d, idx);
    }

    buf[idx] = d;
    return idx + 1;
  }

  let curBuf = allocBuf(1024);
  let curBufIdx = 0;
  buffers.push(curBuf);

  function pushChar(ch) {
    if (curBufIdx === curBuf.length) {
      curBuf = allocBuf(1024);
      curBufIdx = 0;
    }

    debug("write string:", ch);
    curBufIdx += writeStrToBuf(curBuf, curBufIdx, ch); // TODO: may overflow cross bounder
  }

  function pushUint8(d) {
    if (curBufIdx === curBuf.length) {
      curBuf = allocBuf(1024);
      curBufIdx = 0;
    }

    debug("write:", Number(d).toString(16)); // writeUint8 returns offset+written

    curBufIdx = writeUint8ToBuf(curBuf, curBufIdx, d);
    debug("actual write:", curBuf[curBufIdx - 1]);
  }

  let j = i + 1;

  for (; j < n; j++) {
    // TODO: handle escape
    switch (s[j]) {
      case b:
        // truncate the last chunk
        buffers[buffers.length - 1] = buffers[buffers.length - 1].slice(0, curBufIdx);
        const str = Buffer.concat(buffers).toString('utf-8');
        return {
          type: "string",
          value: str,
          next: j + 1
        };

      case '\\':
        if (j + 1 < n && s[j + 1] === '\\') {
          pushChar('\\');
          j++; // skip next
        } else if (j + 1 < n && s[j + 1] === 'n') {
          pushChar('\n');
          j++; // skip next
        } else if (j + 1 < n && s[j + 1] === 't') {
          pushChar('\t');
          j++; // skip next
        } else if (j + 1 < n && s[j + 1] === 'r') {
          pushChar('\r');
          j++; // skip next
        } else if (j + 1 < n && s[j + 1] === '\'') {
          pushChar('\'');
          j++; // skip next
        } else if (j + 1 < n && s[j + 1] === '"') {
          pushChar('"');
          j++; // skip next
        } else if (j + 3 < n && isDigit(s[j + 1]) && isDigit(s[j + 2]) && isDigit(s[j + 3])) {
          // process escape octal
          // if the following 3 are digits, then it is octal
          const x = Number.parseInt(s.slice(j + 1, j + 4), 8);

          if (isNaN(x)) {
            throw new Error(`invalid octal number:${s.slice(i, j + 4)}`);
          }

          pushUint8(x);
          j += 3;
        }

        break;

      default:
        pushChar(s[j]);
        break;
    }
  }

  throw new Error(`invalid string:${s.slice(i, j)}`);
}

function isDigit(c) {
  return c >= '0' && c <= '9';
}

function parseObject(s, n, i) {
  if (s[i] !== '{') {
    throw new Error("not an object");
  }

  const obj = {};
  let j = i + 1; // empty

  if (j < n && s[j] === '}') {
    return {
      type: "object",
      value: obj,
      next: j + 1
    };
  }

  for (; j < n; j++) {
    const {
      type,
      value,
      next
    } = parseField(s, n, j);
    obj[value.key] = value.value;

    if (next >= n) {
      throw new Error(`invalid object, no ending {: ${s.slice(i, next)}`);
    }

    if (s[next] === '}') {
      return {
        type: "object",
        value: obj,
        next: next + 1
      };
    } // more fields
    //        if(s[next]!==' '){
    //            throw new Error(`invalid object,expect more fields{: ${s.slice(i,next+1)}`)
    //        }


    j = next - 1;
  }

  throw new Error("incomplete object");
}

function parseField(s, n, i) {
  const {
    type: keyType,
    value: keyValue,
    next
  } = parseFieldKey(s, n, i);

  if (next >= n || s[next] !== ':') {
    throw new Error(`invalid field,no separator:${s.slice(i, next + 1)},s[${i},${next + 1}]`);
  }

  let {
    type: valueType,
    value: fieldValue,
    next: fieldNext
  } = parseFieldValue(s, n, next + 1); // parseField should consume the extra separator if present.
  // especially ' '

  if (fieldNext < n && s[fieldNext] === ' ') {
    debug("parseField skip space");
    fieldNext++;
  }

  return {
    type: "field",
    value: {
      key: keyValue,
      value: fieldValue
    },
    next: fieldNext
  };
} // usually field key consists of: digit, letter, and _


function parseFieldKey(s, n, i) {
  let j = i;
  let key = '';

  for (; j < n; j++) {
    switch (s[j]) {
      case ':':
        return {
          type: "string",
          value: key,
          next: j
        };

      case ' ':
        return {
          type: "string",
          value: key,
          next: j
        };

      default:
        key += s[j];
        break;
    }
  }

  throw new Error(`invalid field key:${s.slice(i, j + 1)}`);
}

function parseFieldValue(s, n, i) {
  return parseNext(s, n, i);
}

function parseNumber(s, n, i) {
  let num = 0;
  let j = i;

  for (; j < n; j++) {
    if (s[j] < '0' || s[j] > '9') {
      // could be ',' ' '
      if (i === j) {
        throw new Error("empty numer");
      }

      return {
        type: "number",
        value: num,
        next: j
      };
    }

    num = 10 * num + (s[j] - '0');
  }

  return {
    type: "number",
    value: num,
    next: j
  };
}

function parseArray(s, n, i) {
  debug("start parsing array:", i);

  if (s[i] !== '<') {
    throw new Error("not an object");
  }

  const arr = [];
  let j = i + 1;
  let curObj = {};

  for (; j < n; j++) {
    //       if(s[j]==='>'){
    //           arr.push(curObj);
    //           curObj = {};
    //           continue;
    //       }
    debug("before j:", j);
    const {
      value: field,
      next
    } = parseField(s, n, j);
    debug("after j,field,next:", j, field, next);

    if (next >= n) {
      throw new Error(`invalid array, no ending <: ${s.slice(i, next)}`);
    } // value>


    if (s[next] === '>') {
      curObj[field.key] = field.value;
      arr.push(curObj);

      if (next + 1 < n && s[next + 1] === ' ') {
        j = next + 1;
        break;
      }

      j = next;
      continue;
    } // more fields
    //      if(s[next]!==' '){
    //         throw new Error(`invalid object in array,expect more fields{: ${s.slice(i,next+1)}`)
    //      }


    curObj[field.key] = field.value; // value >
    //      if(next+1<n && s[next+1]==='>'){
    //         arr.push(curObj);
    //         j=next+1;
    //         continue;
    //      }

    j = next - 1;
  }

  debug("end parsing array:", i, arr);
  return {
    type: "array",
    value: arr,
    next: j
  };
}