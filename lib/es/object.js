// join by one sep
export function fillDefault(value, defaults) {
    if (!defaults) {
        return value
    }
    for (let k in defaults) {
        if (value[k] === undefined) {
            // not exist or undefined
            value[k] = defaults[k]
        }
    }
    return value
}

// for each key in src, put them into dest
// remove keys not existed
// replace only happens at primitive scopes
export function deepReplace(dest, src) {
    // delete keys not existed
    for (let key of Object.keys(dest)) {
        if (!(key in src)) {
            delete dest[key]
        }
    }

    // set new keys and
    // deep replace existing keys
    for (let key in src) {
        if (!(key in dest)) {
            dest[key] = src[key]
        } else {
            let srcValue = src[key]
            let destValue = dest[key]
            // undefined or null
            if (!destValue || !srcValue) {
                dest[key] = srcValue
                continue
            }
            // primitive
            if (typeof destValue !== 'object' || typeof srcValue !== 'object') {
                dest[key] = srcValue
                continue
            }
            // one is array, one is object
            if (Array.isArray(destValue)) {
                if (Array.isArray(srcValue)) {
                    dest[key].splice(0, dest[key].length, ...srcValue)
                } else {
                    dest[key] = srcValue
                }
                continue
            }
            if (Array.isArray(srcValue)) {
                dest[key] = srcValue
                continue
            }
            // are objects,so do recursive deepReplace
            deepReplace(destValue, srcValue)
        }
    }
    return dest
}

export function deepEquals(dest, src) {
    if (dest === src) {
        return true
    }
    // undefined or null or NaN
    if (isNaN(dest) && isNaN(src)) {
        return true
    }
    // type
    if ((typeof dest) != (typeof src)) {
        return false
    }
    // primitive
    if (typeof dest !== 'object') {
        return false  // dest !== src
    }
    // one is array
    if (Array.isArray(dest)) {
        if (!Array.isArray(src)) {
            return false
        }
        if (dest.length !== src.length) {
            return false
        }
        for (let i = 0; i < dest.length; i++) {
            if (!deepEquals(dest[i], src[i])) {
                return false
            }
        }
        return true
    }
    if (Array.isArray(src)) {
        return false
    }
    // are objects

    // keys not existed
    for (let key of Object.keys(dest)) {
        if (!(key in src)) {
            return false
        }
    }

    // set new keys and
    // deep replace existing keys
    for (let key in src) {
        if (!(key in dest)) {
            return false
        } else {
            let srcValue = src[key]
            let destValue = dest[key]

            if (!deepEquals(destValue, srcValue)) {
                return false
            }
        }
    }
    return true
}

export function deepcopy(src) {
    // primitive
    if (src == null || typeof src !== 'object') {
        return src
    }
    if (Array.isArray(src)) {
        let copy = new Array(src.length).fill(undefined)
        let i = 0
        for (let e of src) {
            copy[i++] = deepcopy(e)
        }
        return copy
    }
    let copy = {}
    for (let key in src) {
        copy[key] = deepcopy(src[key])
    }
    return copy
}

// map object
// o is Array => f(e)      returns array
// o is Object => f(k,v)   returns array
export function map(o, f) {
    if (o == null || typeof o !== 'object') return f(o)
    if (o) {
        if (Array.isArray(o)) { return o.map(f) }
        let result = []
        for (let k in o) {
            result.push(f(k, o[k]))
        }
        return result
    }
}

// export function deepReplaceIgnoreEquals(dest, src) {
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