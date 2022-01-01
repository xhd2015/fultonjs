// join by one sep
import { template } from "@babel/core"
import util from "util"
import * as objpath from "./objpath"

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
    while ((open = s.indexOf("${", open)) !== -1) {
        if (open > 0 && s[open - 1] === '\\') {
            // escaped
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
    if (open === -1 || close === -1) {
        return undefined
    }
    return [open, close]
}

// support syntax:  ${something}, ${something!}
// ! means must
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
        let next = findNextOpenClosePair(template, i)
        if (!next) {
            parts.push(template.slice(i))
            break
        }
        let [open, close] = next
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