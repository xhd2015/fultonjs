"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ANNOTATION = void 0;
exports.stringify = stringify;
const ANNOTATION = Symbol('annotation'); // stringify with annotations
// options:{
// }

exports.ANNOTATION = ANNOTATION;

function stringify(object, options) {
  return new Stringifer(object, options).output();
}

const ARR_INLINE_MAXLEN = 32;

class Stringifer {
  // options
  //  
  constructor(object, options) {
    // annotationKey can also be "$$annotation", "$$comment", just for exampe
    const {
      annotation,
      preserveUndefined,
      pretty,
      annotationKey
    } = options || {}; // when annotations present, pretty is implied

    this._annotation = annotation;
    this._annotationKey = annotationKey || ANNOTATION;
    this._preserveUndefined = preserveUndefined;
    this._pretty = pretty;
    this._indent = "    ";
    this._object = object;
    this._level = 0;
    this._curAnnotation = this._annotation;
  } // return a string


  output() {
    var _a;

    this._level = 0;
    this._curAnnotation = this._annotation;
    const jsonValue = this.object(this._object);

    if (!((_a = this._annotation) === null || _a === void 0 ? void 0 : _a[this._annotationKey]) || this._isScalar(jsonValue)) {
      return jsonValue;
    }

    return this._joinAnnotation(jsonValue, this._annotation, false);
  } // @private


  object(obj) {
    var _a;

    if (obj === null) {
      return 'null';
    } // annotation is processed by parent, not by itself
    // only complex object needs indent


    const type = typeof obj;

    switch (type) {
      case 'undefined':
        return this._preserveUndefined ? 'null' : undefined;
      // should be deleted from parent

      case 'string':
      case 'number':
      case 'boolean':
        return JSON.stringify(obj);

      case 'bigint':
        return obj.toString();

      default:
        const indent = this._curIndent;
        const curAnnotation = this._curAnnotation;

        if (Array.isArray(obj)) {
          const elms = [];
          this._level++;

          for (let i = 0; i < obj.length; i++) {
            const e = obj[i];
            const anno = (_a = this._curAnnotation) === null || _a === void 0 ? void 0 : _a[i]; // for undefined
            // undefined must be represented as null in array, no matter _preseveUndefined or not

            let valJSON = "null";

            if (e !== undefined) {
              this._curAnnotation = anno;
              valJSON = this.object(e);
              this._curAnnotation = curAnnotation;
            }

            elms.push((this._isPretty ? indent + this._indent : '') + this._joinAnnotation(valJSON, anno, i < obj.length - 1));
          } // restore level


          this._level--; // let inline = true
          // if (this._isPretty) {
          //     let totalLength = (elms.length - 1) + 2 + indent.length
          //     elms.forEach(e => totalLength += e.length)
          //     inline = totalLength <= ARR_INLINE_MAXLEN
          // }
          // if (inline) {
          //     return indent + "[" + elms.join(",") + "]"
          // }
          // pretty and not inline
          // for (let i = 0; i < elms.length; i++) {
          //     elms[i] = indent + this._indent + elms[i]
          // }

          if (!this._isPretty) {
            return "[" + elms.join("") + "]";
          } // indent is made by parent


          return "[\n" + elms.join("\n") + "\n" + indent + "]";
        }

        if (obj instanceof Date) {
          return JSON.stringify(obj);
        } // object


        const kv = [];
        const savedLevel = this._level;
        let objKeys = Object.keys(obj); // filter null values

        if (!this._preserveUndefined) {
          objKeys = objKeys.filter(k => obj[k] !== undefined);
        }

        for (let i = 0; i < objKeys.length; i++) {
          const key = objKeys[i];
          const value = obj[key];

          if (value === undefined) {
            if (!this._preserveUndefined) {
              continue;
            }
          }

          this._level = 0;
          const keyJSON = this.object(key);
          this._level = savedLevel + 1;
          const anno = curAnnotation === null || curAnnotation === void 0 ? void 0 : curAnnotation[key];
          this._curAnnotation = anno;
          const jsonValue = this.object(obj[key]);

          const valueWithComment = this._joinAnnotation(jsonValue, anno, i < objKeys.length - 1);

          kv.push((this._isPretty ? indent + this._indent : '') + keyJSON + ":" + valueWithComment);
        }

        this._curAnnotation = curAnnotation;
        this._level = savedLevel;

        if (!this._isPretty) {
          return "{" + kv.join("") + "}";
        }

        return "{\n" + kv.join("\n") + "\n" + indent + "}";
    }
  }

  get _isPretty() {
    return this._pretty;
  }

  get _curIndent() {
    return this._isPretty ? this._indent.repeat(this._level) : '';
  }

  get _lastIndent() {
    return this._isPretty ? this._indent.repeat(this._level - 1) : '';
  }

  _makeComment(text) {
    return this._isPretty ? `// ${text}` : `/* ${text} */`;
  }

  _isScalar(jsonValue) {
    return !((jsonValue === null || jsonValue === void 0 ? void 0 : jsonValue[0]) === '{' || (jsonValue === null || jsonValue === void 0 ? void 0 : jsonValue[0]) === '[');
  }

  _joinAnnotation(jsonValue, annotation, needSeparator) {
    const commentText = annotation === null || annotation === void 0 ? void 0 : annotation[this._annotationKey];
    const sep = needSeparator ? ',' : '';

    if (!commentText) {
      return jsonValue + sep;
    }

    if (jsonValue.startsWith("{\n")) {
      // insert after {\n
      return "{" + this._makeComment(commentText) + "\n" + jsonValue.slice("{\n".length) + sep;
    }

    if (jsonValue.startsWith("[\n")) {
      // insert after [\n
      return "[" + this._makeComment(commentText) + "\n" + jsonValue.slice("{\n".length) + sep;
    }

    if (jsonValue.startsWith("{")) {
      // insert after {
      return "{" + " /* " + commentText + " */ " + jsonValue.slice("{".length) + sep;
    }

    if (jsonValue.startsWith("[")) {
      // insert after [\n
      return "[" + " /* " + commentText + " */ " + jsonValue.slice("[".length) + sep;
    } // scalar values


    return `${jsonValue}${sep} ${this._makeComment(commentText)}`;
  }

}