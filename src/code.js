/* eslint-disable */
// depends:
//  browser: npm install --save @babel/standalone
//  nodejs:  npm install --save-dev @babel/core
// transfer:
//   npm install --save-dev @babel/cli @babel/preset-env
//   npx babel --config-file ./lib/es/babel.config.json lib/es/code.js --out-file lib/code.js
import * as BabelStandalone from "@babel/standalone/babel";
import generate from "@babel/generator";
let Babel = BabelStandalone;
// not browser?
if (typeof window === 'undefined') {
    // use server side babel/core
    Babel = require("@babel/core");
}
else {
    // in browser, must be imported via *
    // import * as BabelStandalone from "@babel/standalone/babel"
    Babel = BabelStandalone || window.Babel;
}
export function parseAst(code) {
    // const {
    //     envName = (0, _environment.getEnv)(),
    //     cwd = ".",
    //     root: rootDir = ".",
    //     rootMode = "root",
    //     caller,
    //     cloneInputAst = true
    const { ast } = Babel.transform(code, { ast: true, cwd: "/tmp", root: "/tmp" });
    return ast;
}
// example: ({"a":10 //\n}) => ({\n  "a": 10 //\n\n});
export function formatCode(code, options) {
    const ast = parseAst(code);
    const { code: genCode } = generate(ast, Object.assign({ filename: 'code.js' }, options), code);
    return genCode;
}
// example: ({"a":10 //\n}) => ({\n  "a": 10 //\n\n});
export function formatExpr(code, options) {
    let genCode = formatCode("(" + code + ")", options);
    genCode = genCode.trim();
    if (genCode.startsWith("(") && genCode.endsWith(");")) {
        return genCode.slice(1, genCode.length - 2);
    }
    return genCode;
}
// all AST Node have the same constructor, they are distinguished by type, not by constructor
function traverseAst(ast, f, after) {
    if (ast == null)
        return;
    let nodeType = Object.getPrototypeOf(ast).constructor;
    function _traverseAst(ast) {
        f(ast);
        for (let key in ast) {
            // traverse each field in ast
            let e = ast[key];
            if (e == null) {
                continue;
            }
            if (e instanceof Array) {
                if (e.length === 0 || Object.getPrototypeOf(e[0]).constructor !== nodeType) {
                    continue;
                }
                for (let i of e) {
                    if (Object.getPrototypeOf(i).constructor === nodeType) {
                        _traverseAst(i);
                    }
                }
            }
            else if (Object.getPrototypeOf(e).constructor === nodeType) {
                _traverseAst(e);
            }
        }
        if (after) {
            after(ast);
        }
    }
    _traverseAst(ast);
}
function isNumericInt(s) {
    if (!s)
        return false;
    if (s[0] === '0')
        return false;
    for (let c of s) {
        if (c < '0' || c > '9') {
            return false;
        }
    }
    return true;
}
// 99999_99999_9999 (14 digits) is ok to represent using Number
// greater value than 99999_99999_9999 is not safe
function isBignumber(s) {
    return s && s.length > 15 && isNumericInt(s);
}
// path doc: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#paths
const bigintRewriteVisitor = {
    NumericLiteral(path) {
        // only NumericLiteral has extra.raw, extra.rawValue
        const { node } = path;
        // convert big ast into code
        // only NumericLiteral has extra.raw, extra.rawValue
        let raw = node.extra.raw;
        if (isBignumber(raw)) {
            // if (bigint === 'string') {
            if (true) { // TODO: enable bigint
                node.extra.raw = '"' + raw + '"';
            }
            else {
                node.extra.raw += 'n';
            }
        }
    }
};
// const debugVisitor = {
//     enter(path) {
//         console.log("visiting:", path.node.type)
//     }
// }
function addTrailingComment(path, comment) {
    const commentOpt = {
        type: "trailing",
        line: true,
        comment,
    };
    if (comment.startsWith("//")) {
        commentOpt.line = true;
        commentOpt.comment = comment.slice("//".length);
    }
    else if (comment.startsWith("/*") && comment.endsWith("*/")) {
        commentOpt.line = false;
        commentOpt.comment = comment.slice("/*".length, comment.length - "*/".length);
    }
    path.addComment(commentOpt.type, commentOpt.comment, commentOpt.line);
}
// not working
// class AnnotationVisitor {
//     constructor(annotation) {
//         this._annotation = annotation
//     }
//     ObjectExpression(path) {
//         console.log("expr")
//     }
//     ObjectProperty(path) {
//         console.log("prop")
//     }
// }
const root = Symbol.for("root");
function makeAnnotationVisitor(annotation) {
    // how to check if current path matches a part inside annotation?
    // enter ObjectExpression, set annotation
    // exit
    const annotationStack = [{
            [root]: annotation
        }];
    let objectPath;
    function pushAnnotation(path) {
        var _a;
        const myPath = objectPath[objectPath.length - 1];
        const myAnnotation = (_a = annotationStack[annotationStack.length - 1]) === null || _a === void 0 ? void 0 : _a[myPath]; // what is the path down to here?
        annotationStack.push(myAnnotation);
        if (myAnnotation === null || myAnnotation === void 0 ? void 0 : myAnnotation[ANNOTATION]) {
            addTrailingComment(path, myAnnotation[ANNOTATION]);
        }
    }
    function popAnnotation(path) {
        annotationStack.splice(annotationStack.length - 1);
    }
    return {
        ObjectExpression: {
            enter(path) {
                if (!objectPath) {
                    objectPath = [root];
                }
                pushAnnotation(path);
            },
            exit(path) {
                popAnnotation(path);
                if ((objectPath === null || objectPath === void 0 ? void 0 : objectPath.length) === 1 && objectPath[0] === root) {
                    objectPath = null;
                }
            }
        },
        // keep a balanced path
        ObjectProperty: {
            enter(path) {
                objectPath.push(path.node.key.name);
                pushAnnotation(path);
            },
            exit(path) {
                // remove the last one
                popAnnotation(path);
                objectPath.splice(objectPath.length - 1, 1);
            }
        },
        // value
        // 'NumericLiteral|StringLiteral|BooleanLiteral': {
        //     enter: pushAnnotation,
        //     exit: popAnnotation
        // },
        // should after ',', or if there is no more
    };
}
function pluginOfVisitor(visitor) {
    return function () {
        return { visitor };
    };
}
export const ANNOTATION = Symbol.for("annotation");
// transfer large number to string in code
// options: {
//    removeSemicolon:false,
//    object: false,          // whether treat the code as an object expression,if true, will add '()' to surrend code
//    format: false,          // whether to format the output code
//    bigint:'string'|'bigint'|undefined  // string is preferred, it coverts large number xxx into "xxx"
//    annotation: {}          //  {a:{b:{[ANNOTATION]:"// some comment", "c":{...}}}}
//                            //       example: {"a":{"b":{[ANNOTATION]:"/* something */"}}
//    debug:false
//  }
// Babel transform '(...)' into '();'
// return:
export function transferCode(code, options) {
    let { bigint, object, format, annotation, debug } = options || {};
    const needTransfrom = bigint || format;
    if (!needTransfrom) {
        return code;
    }
    const plugins = [];
    if (bigint) {
        plugins.push(pluginOfVisitor(bigintRewriteVisitor));
    }
    if (annotation) {
        // plugins.push(pluginOfVisitor(new AnnotationVisitor(annotation)))
        plugins.push(pluginOfVisitor(makeAnnotationVisitor(annotation)));
    }
    const astCode = object ? '(' + code + ')' : code;
    // parse ast first
    let { ast } = Babel.transform(astCode, {
        ast: true,
        configFile: false,
        babelrc: false,
        plugins,
    });
    if (debug) {
        //     plugins.push(pluginOfVisitor(debugVisitor))
        traverseAst(ast, (node) => {
            console.log("[DEBUG] visiting:", node.type);
        });
    }
    if (format) {
        // transferCode(`{a:10//ddd\n}`, {object:true,format:true})
        // =>
        // 
        // ({
        //     a: 10 //ddd
        //   });
        // retainLines: true => not formatted
        // retainLines: false => formatted
        let { code: genCode } = generate(ast, { configFile: false, babelrc: false, retainLines: false }, astCode);
        if (object) {
            if (genCode.endsWith(";")) {
                genCode = genCode.slice(0, genCode.length - 1);
            }
            if (genCode.startsWith("(") && genCode.endsWith(")")) {
                genCode = genCode.slice(1, genCode.length - 1);
            }
            // remove extra newline
            // example: transferCode(`{a:10 // fuck ads\n}`, {object:true,format:true}))
            //          =>
            // {
            //     a: 10 // fuck ads
            // }
            if (genCode.endsWith("\n\n}")) {
                genCode = genCode.slice(0, genCode.length - "\n\n}".length) + "\n}";
            }
        }
        code = genCode;
    }
    else {
        // transform back
        let res = Babel.transformFromAst(ast, null, {});
        code = res.code;
        if (code) {
            if ((options === null || options === void 0 ? void 0 : options.removeSemicolon) && code.endsWith(";")) {
                code = code.slice(0, code.length - 1);
            }
        }
    }
    return code;
}
// first arg is code in string,second arg is optional options
// options:  {bigint:'string'|'bigint'|undefined}
function loadCode(______, _______) {
    // protect contextual code from being modified by the code
    if (______) {
        return eval(transferCode('(' + ______ + ")", Object.assign(Object.assign({}, _______), { removeSemicolon: true })));
    }
    return undefined;
}
function loadCodeBigintAsString(code) {
    return loadCode(code, { bigint: "string" });
}
// load the functional code, if it is an plain object
// return it
// if it is a function, return the function result
function loadFunctional(code, options, ...args) {
    let object = loadCode(code, options);
    if (typeof object === 'function') {
        object = object(...args);
    }
    return object;
}
// function loadCodeWithContext(context, ______) { // ______ is code
//     // code can visit context,but no other names is available
//     if (______) {
//         return eval('(' + ______ + ')')
//     }
//     return null
// }
export { traverseAst, loadCode, loadCodeBigintAsString, loadFunctional, };
