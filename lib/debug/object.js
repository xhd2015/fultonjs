"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assignMissing = assignMissing;
exports.deepEquals = deepEquals;
exports.deepKeyConvert = deepKeyConvert;
exports.deepReplace = deepReplace;
exports.deepclean = deepclean;
exports.deepcopy = deepcopy;
exports.deepextends = deepextends;
exports.deepmerge = deepmerge;
exports.fillDefault = fillDefault;
exports.keysIfObject = keysIfObject;
exports.map = map;

// join by one sep
function fillDefault(value, defaults) {
  if (!defaults) {
    return value;
  }

  for (let k in defaults) {
    if (value[k] === undefined) {
      // not exist or undefined
      value[k] = defaults[k];
    }
  }

  return value;
} ///////////////////////////
/////// deep functions ////
// for each key in src, put them into dest
// remove keys not existed
// replace only happens at primitive scopes


function deepReplace(dest, src) {
  // delete keys not existed
  for (let key of Object.keys(dest)) {
    if (!(key in src)) {
      delete dest[key];
    }
  } // set new keys and
  // deep replace existing keys


  for (let key in src) {
    if (!(key in dest)) {
      dest[key] = src[key];
    } else {
      let srcValue = src[key];
      let destValue = dest[key]; // undefined or null

      if (!destValue || !srcValue) {
        dest[key] = srcValue;
        continue;
      } // primitive


      if (typeof destValue !== 'object' || typeof srcValue !== 'object') {
        dest[key] = srcValue;
        continue;
      } // one is array, one is object


      if (Array.isArray(destValue)) {
        if (Array.isArray(srcValue)) {
          dest[key].splice(0, dest[key].length, ...srcValue);
        } else {
          dest[key] = srcValue;
        }

        continue;
      }

      if (Array.isArray(srcValue)) {
        dest[key] = srcValue;
        continue;
      } // are objects,so do recursive deepReplace


      deepReplace(destValue, srcValue);
    }
  }

  return dest;
} // deepmerge: deep merge object, replace null, undefined, array or primitive types
// details:
//   for each key in src, 
//        if dest[key] does not exist, or either dest[key] or src[key] is undefined, null, array or primtive
//             set dest[key]=src[key]
//        otherwise:
//            dest[key] does exist, and dest[key] and src[key] are both object(not array):
//            do deep merge on dest[key] & src[key]  recursively


function deepmerge(dest, src) {
  // src is existed and must either merge with dest, or replace dest
  if (!src || !dest) {
    return src;
  }

  const srcType = typeof src;

  if (srcType !== 'object' || Array.isArray(src)) {
    return src;
  }

  const destType = typeof dest;

  if (destType !== 'object' || Array.isArray(dest)) {
    return src;
  } // both src and dest are object,and are not array
  // so they can be merged


  for (let key in src) {
    dest[key] = deepmerge(dest[key], src[key]);
  }

  return dest;
} // requirements: dest, base not empty


function doDeepExtends(dest, base) {
  if (dest === base) {
    return;
  }

  for (let key in base) {
    if (!(key in dest)) {
      // if baseValue is explicit undefined or null,then assign to dest
      dest[key] = base[key];
      continue;
    }

    const destValue = dest[key];

    if (typeof destValue !== 'object' || Array.isArray(destValue) || destValue == null) {
      // skip not replaceable fields
      continue;
    }

    const baseValue = base[key];

    if (typeof baseValue !== 'object' || Array.isArray(baseValue) || baseValue == null) {
      // cannot merge
      continue;
    }

    doDeepExtends(destValue, baseValue);
  }
} // deepextends: deep extends object, for key in base but not in dest, copy them to dest
// there is one invariant:   A extends B, B extends C
//                           same with ==>:
//                           A extends B, A extends C
// requirement: dest must be not null
// note that: the result may contains reference to fields of base
// if you want to avoid mutation, do a deepcopy on result


function deepextends(dest, base) {
  if (dest === base) {
    return dest;
  }

  if (!dest) {
    throw new Error("deepextends:dest cannot be null");
  }

  if (!base) {
    return dest;
  }

  const destType = typeof dest;

  if (destType !== 'object' || Array.isArray(dest)) {
    throw new Error("deepextends:dest must be be object, not array or other types:" + destType);
  }

  const baseType = typeof base;

  if (baseType !== 'object' || Array.isArray(base)) {
    throw new Error("deepextends:base must be be object, not array or other types" + baseType);
  } // dest && base are both object, and are not null


  doDeepExtends(dest, base);
  return dest;
}

function deepEquals(dest, src) {
  if (dest === src) {
    return true;
  } // undefined or null or NaN
  // note: isNaN({}) === true, isNaN([]) === false
  // so do not use isNaN on object
  // if (isNaN(dest) && isNaN(src)) {
  //     return true
  // }
  // type


  const typeofDst = typeof dest;
  const typeofSrc = typeof src;

  if (typeofDst !== typeofSrc) {
    return false;
  } // one is primitive, and === test failed


  if (typeofDst !== 'object') {
    // because NaN === NaN ==> false, so we should test further
    if (typeofDst === 'number' && typeofSrc === 'number' && isNaN(dest) && isNaN(src)) {
      return true;
    }

    return false; // dest !== src
  } // one is array


  if (Array.isArray(dest)) {
    if (!Array.isArray(src)) {
      return false;
    }

    if (dest.length !== src.length) {
      return false;
    }

    for (let i = 0; i < dest.length; i++) {
      if (!deepEquals(dest[i], src[i])) {
        return false;
      }
    }

    return true;
  }

  if (Array.isArray(src)) {
    return false;
  } // are objects
  // keys not existed


  for (let key in dest) {
    if (!(key in src)) {
      return false;
    }
  } // set new keys and
  // deep replace existing keys


  for (let key in src) {
    if (!(key in dest)) {
      return false;
    } else {
      let srcValue = src[key];
      let destValue = dest[key];

      if (!deepEquals(destValue, srcValue)) {
        return false;
      }
    }
  }

  return true;
}

function deepcopy(src) {
  // primitive
  if (src == null || typeof src !== 'object') {
    return src;
  }

  if (Array.isArray(src)) {
    let copy = new Array(src.length).fill(undefined);
    let i = 0;

    for (let e of src) {
      copy[i++] = deepcopy(e);
    }

    return copy;
  }

  let copy = {};

  for (let key in src) {
    copy[key] = deepcopy(src[key]);
  }

  return copy;
} // remove null values, include value in array


function deepclean(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    const cleaned = [];

    for (let v of obj) {
      if (v != null) {
        cleaned.push(deepclean(v));
      }
    }

    return cleaned;
  } else {
    // object
    const cleaned = {};

    for (let key in obj) {
      const value = obj[key];

      if (value != null) {
        cleaned[key] = deepclean(value);
      }
    }

    return cleaned;
  }
} // convert(key) => key


function deepKeyConvert(src, convert) {
  // primitive
  if (src == null || typeof src !== 'object') {
    return src;
  }

  if (Array.isArray(src)) {
    let copy = new Array(src.length).fill(undefined);
    let i = 0;

    for (let e of src) {
      copy[i++] = deepKeyConvert(e, convert);
    }

    return copy;
  }

  let copy = {};

  for (let key in src) {
    copy[convert(key)] = deepKeyConvert(src[key], convert);
  }

  return copy;
} ////////////////////////////////
///// ordinary functions //////
// map object
// o is Array => f(e)      returns array
// o is Object => f(k,v)   returns array


function map(o, f) {
  if (o == null || typeof o !== 'object') return f(o);

  if (o) {
    if (Array.isArray(o)) {
      return o.map(f);
    }

    let result = [];

    for (let k in o) {
      result.push(f(k, o[k]));
    }

    return result;
  }
} // assign keys from src to dst,  if that key does not exist in dst


function assignMissing(dst, src) {
  if (src == null) {
    return dst;
  }

  if (dst == null) {
    throw new TypeError("cannot assign to undefined or null object");
  }

  if (typeof src !== 'object') {
    throw new TypeError("cannot assign from object type:" + typeof src + ", only object supported");
  }

  for (let k in src) {
    if (!(k in dst)) {
      dst[k] = src[k];
    }
  }

  return dst;
}

function keysIfObject(obj) {
  if (typeof obj === "object" && !Array.isArray(obj)) {
    return Object.keys(obj);
  }

  return [];
} // export function deepReplaceIgnoreEquals(dest, src) {
//     // delete keys not existed
//     for (let key of Object.keys(dest)) {
//         if (!(key in src)) {
//             delete dest[key]
//         }
//     }
//     // set new keys and
//     // deep replace existing keys
//     for (let key in src) {
//         if (!(key in dest)) {
//             dest[key] = src[key]
//         } else if (key in dest) {
//             let srcValue = src[key]
//             let destValue = dest[key]
//             // undefined or null
//             if (!destValue || !srcValue) {
//                 dest[key] = srcValue
//                 continue
//             }
//             // primitive
//             if (typeof destValue !== 'object' || typeof srcValue !== 'object') {
//                 dest[key] = srcValue
//                 continue
//             }
//             // one is array, one is object
//             if (Array.isArray(destValue)) {
//                 if (Array.isArray(srcValue)) {
//                     dest[key].splice(0, dest[key].length, ...srcValue)
//                 } else {
//                     dest[key] = srcValue
//                 }
//                 continue
//             }
//             if (Array.isArray(srcValue)) {
//                 dest[key] = srcValue
//                 continue
//             }
//             // are objects,so do recursive deepReplace
//             deepReplace(destValue, srcValue)
//         }
//     }
//     return dest
// }