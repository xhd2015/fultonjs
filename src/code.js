/* eslint-disable */
// depends:
//  browser: npm install --save @babel/standalone
//  nodejs:  npm install --save-dev @babel/core
// transfer:
//   npm install --save-dev @babel/cli @babel/preset-env
//   npx babel --config-file ./lib/es/babel.config.json lib/es/code.js --out-file lib/code.js
import BabelStandalone from "@babel/standalone/babel"
let Babel = BabelStandalone
// not browser?
if (typeof window === 'undefined') {
    // use server side babel/core
    Babel = require("@babel/core")
}else{
    Babel = BabelStandalone || window.Babel
}

function traverseAst(ast, f) {
    if (ast == null) return
    let nodeType = Object.getPrototypeOf(ast).constructor

    function _traverseAst(ast) {
        f(ast)
        for (let key in ast) {
            let e = ast[key]
            if (e == null) {
                continue
            }
            if (e instanceof Array) {
                if (e.length === 0 || Object.getPrototypeOf(e[0]).constructor !== nodeType) {
                    continue
                }
                for (let i of e) {
                    _traverseAst(i)
                }
            } else if (Object.getPrototypeOf(e).constructor === nodeType) {
                _traverseAst(e)
            }
        }
    }

    _traverseAst(ast)
}

function isNumericInt(s) {
    if (!s) return false
    if (s[0] === '0') return false
    for (let c of s) {
        if (c < '0' || c > '9') {
            return false
        }
    }
    return true
}
// 99999_99999_9999 (14 digits) is ok to represent using Number
// greater value than 99999_99999_9999 is not safe
function isBignumber(s) {
    return s && s.length > 15 && isNumericInt(s)
}

// transfer large number to string in code
// options: {removeSemicolon:false, bigint:'string'|'bigint'|undefined }
function trasferCode(code, options) {
    let { bigint } = options || {}
    if (bigint) {
        let { ast } = Babel.transform(code, { ast: true })
        traverseAst(ast, function (e) {
            if (e.type === 'NumericLiteral') {
                let raw = e.extra.raw
                if (bigint && isBignumber(raw)) {
                    if (bigint === 'string') {
                        e.extra.raw = '"' + raw + '"'
                    } else {
                        e.extra.raw += 'n'
                    }
                }
            }
        })
        let res = Babel.transformFromAst(ast, null, {})
        code = res.code
        if (code) {
            if (options && options.removeSemicolon && code.endsWith(";")) {
                code = code.slice(0, code.length - 1)
            }
        }
    }
    return code
}

// first arg is code in string,second arg is optional options
// options:  {bigint:'string'|'bigint'|undefined}
function loadCode(______, _______) {
    // protect contextual code from being modified by the code
    if (______) {
        return eval(trasferCode('(' + ______ + ")", {..._______, removeSemicolon: true }))
    }
    return undefined
}
function loadCodeBigintAsString(code) {
    return loadCode(code, { bigint: "string" })
}
// load the functional code, if it is an plain object
// return it
// if it is a function, return the function result
function loadFunctional(code, options, ...args) {
    let object = loadCode(code, options)
    if (typeof object === 'function') {
        object = object(...args)
    }
    return object
}
// function loadCodeWithContext(context, ______) { // ______ is code
//     // code can visit context,but no other names is available
//     if (______) {
//         return eval('(' + ______ + ')')
//     }
//     return null
// }

export {
    traverseAst,
    trasferCode,
    loadCode,
    loadCodeBigintAsString,
    loadFunctional,
}
