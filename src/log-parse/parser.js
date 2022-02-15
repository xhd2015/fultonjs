// parse implements a nearly strict log parser
import { isDigit } from "../char";
import { makeDebug } from "../debug-util";
import { guessLogOptions } from "./guess";
// const isDebug = false;
const debug = makeDebug(false);
const defaultOptions = {
    category: '',
    kvSep: ':',
    fieldSep: [' '],
    stringWithQuote: false,
    arrayBeginChar: '[',
    arrayEndChar: ']',
    objectBeginChar: '{',
    objectEndChar: '}',
};
export class Parser {
    constructor(options) {
        this.options = Object.assign(Object.assign({}, defaultOptions), options);
    }
    parse(s) {
        if (!s) {
            return { type: 'null', value: null, next: 0 };
        }
        return this.parseNext(s, s.length, 0);
    }
    // parse(): ParseResult {
    //     return {}
    // }
    // @private
    parseNext(s, n, i) {
        for (let j = i; j < n; j++) {
            switch (s[j]) {
                case '"':
                case '\'':
                    return this.parseString(s, n, j);
                case '{':
                    return this.parseObject(s, n, j);
                case '<':
                    return this.parseObjectUntil(s, n, j + 1, '>');
                default:
                    if (s[j] >= '0' && s[j] <= '9') {
                        return this.parseNumber(s, n, j);
                    }
                    throw new Error("unknow type:" + s.slice(i, j + 1));
            }
        }
    }
    parseString(s, n, i) {
        const b = s[i];
        if (b !== '"' && b !== '\'') {
            throw new Error(`invalid string begin,expect '",found ${b}`);
        }
        let buffers = [];
        // node has Buffer, browser has Int8Array
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
            debug("write:", Number(d).toString(16));
            // writeUint8 returns offset+written
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
                    return { type: "string", value: str, next: j + 1 };
                case '\\':
                    if (j + 1 < n && s[j + 1] === '\\') {
                        pushChar('\\');
                        j++; // skip next
                    }
                    else if (j + 1 < n && s[j + 1] === 'n') {
                        pushChar('\n');
                        j++; // skip next
                    }
                    else if (j + 1 < n && s[j + 1] === 't') {
                        pushChar('\t');
                        j++; // skip next
                    }
                    else if (j + 1 < n && s[j + 1] === 'r') {
                        pushChar('\r');
                        j++; // skip next
                    }
                    else if (j + 1 < n && s[j + 1] === '\'') {
                        pushChar('\'');
                        j++; // skip next
                    }
                    else if (j + 1 < n && s[j + 1] === '"') {
                        pushChar('"');
                        j++; // skip next
                    }
                    else if (j + 3 < n && isDigit(s[j + 1]) && isDigit(s[j + 2]) && isDigit(s[j + 3])) {
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
    parseObject(s, n, i) {
        if (s[i] !== '{') {
            throw new Error("not an object");
        }
        return this.parseObjectUntil(s, n, i + 1, '}');
    }
    parseObjectUntil(s, n, i, untilChar) {
        const obj = {};
        let j = i;
        // empty
        if (j < n && s[j] === untilChar) {
            return { type: "object", value: obj, next: j + 1 };
        }
        const arrayKey = {};
        for (; j < n; j++) {
            const { type, value, next } = this.parseField(s, n, j);
            const field = value;
            if (field.key in obj) {
                // convert to array
                if (!arrayKey[field.key]) {
                    arrayKey[field.key] = true;
                    obj[field.key] = [obj[field.key], field.value];
                }
                else {
                    if (!Array.isArray(obj[field.key])) {
                        throw new Error(`illegal state, ${field.key} must be array`);
                    }
                    obj[field.key].push(field.value);
                }
            }
            else {
                obj[field.key] = field.value;
            }
            if (next >= n) {
                throw new Error(`invalid object, no ending {: ${s.slice(i, next)}`);
            }
            if (s[next] === untilChar) {
                return { type: "object", value: obj, next: next + 1 };
            }
            // more fields
            //        if(s[next]!==' '){
            //            throw new Error(`invalid object,expect more fields{: ${s.slice(i,next+1)}`)
            //        }
            j = next - 1;
        }
        throw new Error("incomplete object");
    }
    parseField(s, n, i) {
        const { type: keyType, value: keyValue, next } = this.parseFieldKey(s, n, i);
        if (next >= n || s[next] !== ':') {
            throw new Error(`invalid field,no separator:${s.slice(i, next + 1)},s[${i},${next + 1}]`);
        }
        let { type: valueType, value: fieldValue, next: fieldNext } = this.parseFieldValue(s, n, next + 1);
        // parseField should consume the extra separator if present.
        // especially ' '
        if (fieldNext < n && s[fieldNext] === ' ') {
            debug("parseField skip space");
            fieldNext++;
        }
        return { type: "field", value: { key: keyValue, value: fieldValue }, next: fieldNext };
    }
    // usually field key consists of: digit, letter, and _
    parseFieldKey(s, n, i) {
        let j = i;
        let key = '';
        for (; j < n; j++) {
            switch (s[j]) {
                case ':':
                    return { type: "string", value: key, next: j };
                case ' ':
                    return { type: "string", value: key, next: j };
                default:
                    key += s[j];
                    break;
            }
        }
        throw new Error(`invalid field key:${s.slice(i, j + 1)}`);
    }
    parseFieldValue(s, n, i) {
        return this.parseNext(s, n, i);
    }
    parseNumber(s, n, i) {
        let num = 0;
        let j = i;
        for (; j < n; j++) {
            if (s[j] < '0' || s[j] > '9') { // could be ',' ' '
                if (i === j) {
                    throw new Error("empty numer");
                }
                return { type: "number", value: num, next: j };
            }
            num = 10 * num + Number(s[j].charCodeAt(0) - '0'.charCodeAt(0));
        }
        return { type: "number", value: num, next: j };
    }
    parseArray(s, n, i) {
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
            const { value: fieldValue, next } = this.parseField(s, n, j);
            debug("after j,field,next:", j, fieldValue, next);
            if (next >= n) {
                throw new Error(`invalid array, no ending <: ${s.slice(i, next)}`);
            }
            const field = fieldValue;
            // value>
            if (s[next] === '>') {
                curObj[field.key] = field.value;
                arr.push(curObj);
                if (next + 1 < n && s[next + 1] === ' ') {
                    j = next + 1;
                    break;
                }
                j = next;
                continue;
            }
            // more fields
            //      if(s[next]!==' '){
            //         throw new Error(`invalid object in array,expect more fields{: ${s.slice(i,next+1)}`)
            //      }
            curObj[field.key] = field.value;
            // value >
            //      if(next+1<n && s[next+1]==='>'){
            //         arr.push(curObj);
            //         j=next+1;
            //         continue;
            //      }
            j = next - 1;
        }
        debug("end parsing array:", i, arr);
        return { type: "array", value: arr, next: j };
    }
}
export function guess(s) {
    const opts = guessLogOptions(s);
    if (!(opts.length > 0)) {
        // the default guess
        return tryParseAll(s);
    }
    const objects = opts.map(opt => {
        if (opt.category === 'Service Called Reqeust') {
            const res = new Parser().parseObjectUntil(s, s.length, opt.serviceCalledRequestOptions.reqObjectStart, '}');
            return res === null || res === void 0 ? void 0 : res.value;
        }
    });
    if (objects.length === 1) {
        return objects[0];
    }
    return objects;
}
export function tryParseAll(s) {
    const parser = new Parser();
    const objs = [];
    const n = s.length;
    for (let i = 0; i < n; i++) {
        if (s[i] !== '{') {
            continue;
        }
        debug(`START AT:${i}, ${s.slice(i, i + 20)}`);
        try {
            const { type, value, next } = parser.parseObject(s, n, i);
            i = next - 1;
            objs.push(value);
        }
        catch (e) {
            // ignore
            debug(e);
            // console.error(e)
        }
    }
    return objs;
}
