// join by one sep
import { template } from "@babel/core"
import util from "util"
import * as objpath from "./objpath"

// 'a/' + '/b' => 'a/b'
export function joinByOneSep(a, b, sep) {
    if (!a) {
        return b
    }
    if (!b) {
        return a
    }
    let aHasSep = a.endsWith(sep)
    let bHasSep = b.startsWith(sep)
    if (aHasSep && bHasSep) {
        return a.slice(0, a.length - 1) + b
    } else if (!aHasSep && !bHasSep) {
        return a + sep + b
    } else {
        return a + b
    }
}

export function countLines(s) {
    let i = -1
    let cnt = 1
    while ((i = s.indexOf("\n", i + 1)) !== -1) {
        cnt++
    }
    return cnt
}

export function indentLines(s, prefix) {
    if (!prefix) {
        return s
    }
    return s.split("\n").map(e => prefix + e).join("\n")
}

export function removeSuiffx(s, suffix) {
    if (s && suffix && s.endsWith(suffix)) {
        return s.slice(0, s.length - suffix.length)
    }
    return s
}

export function format(format, ...args) {
    return util.format(format, ...args)
}

export function capitalize(s) {
    if (!s || !s[0]) {
        return s
    }
    return s[0].toUpperCase() + s.slice(1)
}

function findNextOpenClosePair(s, start) {
    let open = start
    let close = -1
    let escapes = []
    while ((open = s.indexOf("${", open)) !== -1) {
        if (open > 0 && s[open - 1] === '\\') {
            // escaped, should be recovered
            escapes.push(open - 1)
            continue
        }
        close = s.indexOf("}", open + 2)
        if (close === -1) {
            break // not found
        }
        if (close === open + 2 || (close === open + 3 && s[close - 1] === '!')) { // empty
            open = close + 1
            continue
        }
        break
    }
    return [open, close, escapes]
}

// support syntax:  ${something}, ${something!}
// suffix ! means if value is null, the original template is kept
// do not support nested
// example:  interpolation("adsfa:${a},b:${b!}",{a:1})
//           =>
//           adsfa:1,b:${b!}
export function interpolation(template, ...ctx) {
    if (!template || !template.includes("${")) {
        return template
    }
    // parse all placeholders
    let parts = []
    let i = 0
    // loop invariant:  i is at begining of next search
    while (true) {
        // must have escapes[any] < open
        let [open, close, escapes] = findNextOpenClosePair(template, i)
        // process escapes
        let escStart = i
        for (let escEnd of escapes) {
            parts.push(escStart, escEnd) // exclude escEnd
            escStart = escEnd + 1
        }
        if (open === -1 || close === -1) {
            parts.push(template.slice(i))
            break
        }
        open -= escapes.length // removed
        close -= escapes.length
        parts.push(template.slice(i, open))
        let segment = template.slice(open + 2, close)
        let must = false
        if (segment.endsWith("!")) {
            must = true
            segment = segment.slice(0, segment.length - 1)
        }
        parts.push({ key: segment, must })
        i = close + 1
    }

    // parts is compiled, now combine them
    return parts.map(e => {
        if (typeof e === 'string') {
            return e
        }
        // read from all
        let value
        for (let c of ctx) {
            value = objpath.get(c, e.key)
            if (value != null) {
                break
            }
        }
        if (value == null) {
            if (e.must) {
                value = "${" + e.key + "!}"
                // throw new Error("cannot get " + key)
            } else {
                value = ""
            }
        }
        return value
    }).join("")
}

// flatten split: 
//  if s is string, split s with separator and return
//  if s is array of string, every string in array is splitted and flatten to array
// example:
//   "a" => ["a"]
//   "a,b" => ["a","b"]
//   ["a,b","c,d"] => ["a","b","c","d"]
// options: {trim:true(default), ignoreEmpty:true(default)}
// usage scenerio:   parse the http query parameter
export function flattenSplit(s, separator = ",", options) {
    let { trim = true, ignoreEmpty = true } = options || {}

    let result = []
    // typeof e === 'string'
    function splitString(e) {
        if (e == null) {
            return
        }
        let tp = typeof e

        if (tp !== 'string') {
            if (tp !== 'number' || !isNaN(e)) {
                result.push(e)
            }
            return
        }
        let it = e.split(separator, -1)
        if (trim) {
            it = it.map(e => e.trim())
        }
        if (ignoreEmpty) {
            it = it.filter(e => e)
        }
        result.push(...it)
    }

    if (Array.isArray(s)) {
        for (let e of s) {
            splitString(e)
        }
    } else {
        splitString(s)
    }
    return result
}

// escape string
export function escapeShell(word) {
    word = word || ''
    let idx = word.indexOf("'")
    if (idx != -1) {
        word = word.replace("'", "'\\''")  // escape the ' with \'
    }
    return "'" + word + "'"
}

export function escapeHTMLText(s) {
    if (!s) {
        return s
    }
    let h = ''
    for (let i = 0; i < s.length; i++) {
        let c = s[i]
        switch (s[i]) {
            case '\n':
                c = '<br/>'
                break
            case ' ':
                c = '&nbsp;'
                break
            case '&':
                c = '&amp;'
                break
        }
        h += c
    }
    return h
}



export function isEmpty(v) {
    // 0 == '' ==> true
    return v == null || v === ""
}
export function isNotEmpty(v) {
    // 0 == '' ==> true
    return  !isEmpty(v)
}

// positive: true => positive
//           false => negative
//           undefined => no sign requirement
export function isNumeric(v, positive) {
    if (v == null || v === '') {
        return false
    }
    let valueType = typeof v
    if (valueType === 'string') {
        return isStringAndNumeric(v, positive)
    }
    if (valueType === 'number') {
        if (isNaN(v) || v === Infinity || v === -Infinity) {
            return false
        }
        if (positive === true) {
            return v > 0
        } else if (positive === false) {
            return v < 0
        }
        return true
    }
    return false
}
export function isNumericString(s, positive) {
    if (typeof s !== 'string' || s === '') {
        return false
    }
    return isStringAndNumeric(s, positive)
}
// s: not empty
// Number("0098") => 98
function isStringAndNumeric(s, positive) {
    let idx = 0
    if (s.startsWith("+")) {
        if (positive === false) {
            return false
        }
        idx = 1
    } else if (s.startsWith("-")) {
        if (positive === true) {
            return false
        }
        idx = 1
    } else {
        if (positive === false) {
            return false
        }
    }
    if (idx === s.length) {
        return false
    }
    for (; idx < s.length; idx++) {
        const c = s[idx]
        if (c < '0' || c > '9') {
            return false
        }
    }
    return true
}

export function isPositive(v) {
    return isNumeric(v, true)
}
