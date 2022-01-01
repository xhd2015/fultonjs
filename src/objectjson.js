export class StringJSONObject {
  /**
   * 
   * @param {*} object  can be null
   * @param {object} options 
   * -   options.stringify     define how to stringify a object
   * -   options.parse         define how to parse a string
   */
  constructor(object, options) {
    const { stringify = JSON.stringify, parse = JSON.parse, silent = true } =
      options || {};
    if (!stringify || !parse) {
      throw new Error("requires stringify and parse");
    }
    this._object = object;
    this._json = stringify(object);

    this._stringify = stringify;
    this._parse = parse;
    this._silent = silent;
  }

  set object(obj) {
    if (obj === this._object) {
      return;
    }
    try {
      this._json = this._stringify(obj);
      this._object = obj;
    } catch (e) {
      if (this._silent) {
        return;
      }
      throw e;
    }
  }
  get object() {
    return this._object;
  }
  // on error will be rejected
  set json(json) {
    if (json == null || json === '') {
      this._object = undefined;
      this._json = json;
      return;
    }

    if (typeof json !== "string") {
      throw new Error("set json must be string");
    }
    if (json === this._json) {
      return;
    }
    try {
      this._object = this._parse(json);
      this._json = json;
    } catch (e) {
      if (this._silent) {
        return;
      }
      throw e
    }
  }

  get json() {
    return this._json;
  }
  // propose
  // addObjectListener(listener){

  // }
  // removeObjectListener(listener){

  // }
}



/// specifically for vue, but other runtime can also use it.
// https://stackoverflow.com/questions/27673323/javascript-properties-with-setter-methods-arent-real-properties/27673474
//
// setter/getter are will return false on hasOwnProperty
// and vue.js rely on that

// on initial $set(target,key,value)
//    if target has OwnProperty, then set is called,
//    but since setter is not vue reactiveSetter, so no magic found.
// SO WE FOUND THIS CASE:  for property with hasOwnProperty() returns true, 
//                         initial $set will not call defineReactive on it
//                         so the plane setter or property value is set
//                         no dependency propagation happens.
// options: 
//   defineReactive:  will define reactive on it
//   stringify
//   parse
//   debug: boolean whether define debug
//   silent: boolean, default true. whether throw error if parse failed
//   errHanlder: function,  handler for error
export function JSONObject(value, options) {
  let _object = undefined
  let _json = ""

  let {stringify, parse} = options || {}
  const {debug = false, silent = true, defineReactive, errHandler} = options || {}

  if (!stringify) {
    stringify = function (o) {
      return o == null ? "" : JSON.stringify(o)
    }
  }
  if (!parse) {
    parse = function (s) {
      return s ? JSON.parse(s) : undefined
    }
  }

  Object.defineProperty(this, "json", {
    configurable: true,
    get() {
      return _json
    },
    set(s) {
      if (debug) {
        console.log("setting json:", s)
      }
      if(s==null){
        s=""
      }
      if (s === _json) {
        return
      }
      if (typeof s !== 'string') {
        throw new TypeError("json expecting string,found:" + typeof s)
      }
      _json = s // always set
      try {
        _object = parse(s)
      } catch (e) {
        if (debug) {
          console.error("parse json err:", e, "\n-->", s)
        }
        if (errHandler) {
          errHandler(e)
        } else if (!silent) {
          throw e
        }
        // no handler && silent
      }
    }
  })

  Object.defineProperty(this, "object", {
    configurable: true,
    get() {
      return _object
    },
    set(o) {
      if (debug) {
        console.log("setting object:", o)
      }
      if (o === _object) {
        return
      }
      _json = stringify(o)
      _object = o
    }
  })
  if (value) {
    this.json = value
  }

  // must be added, because we already have property json/object on
  // it. 
  // because we want our setter propagates custom behavior, so we must
  // 1.define them as properties,and must be configurable, 2.call defineReactive so that setter/getter wrapper 
  // gets wrapped
  if (defineReactive) {
    defineReactive(this, "json", this.json)
    defineReactive(this, "object", this.object)
  }
}