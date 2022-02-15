
import { Parser, guess, tryParseAll } from "./parser";

export { tryParseAll }

// interface ParseOptions {
// }

// primary entrance
export function tryParse(s: string /*,options?: ParseOptions*/): any {
    // currently options are ignored
    return guess(s)
}

export function parseOne(s) {
    const parser = new Parser()
    return parser.parseNext(s, s.length, 0)
}
export function parseNext(s, n, i) {
    const parser = new Parser()
    return parser.parseNext(s, n, i)
}
export function parseString(s, n, i) {
    const parser = new Parser()
    return parser.parseString(s, n, i)
}

export function parseObject(s, n, i) {
    const parser = new Parser()
    return parser.parseObject(s, n, i)
}
