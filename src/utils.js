// depercated: use src
export function randInt(low, high) {
    return Math.floor(Math.random() * (high - low)) + low
}
export function randItem(array) {
    return array[randInt(0, array.length)]
}

// map to array
export function map(obj, f) {
    return Object.keys(obj).map((key, index) => f(key, obj[key], index))
}
export function mapToArray(obj, f) {
    return obj && Object.keys(obj).map((key, index) => f(key, obj[key], index))
}
export function values(obj) {
    return map(obj, (_, v) => v)
}
export function keyValues(obj) {
    return map(obj, (key, value) => ({ key, value }))
}

// remap to object
export function remap(obj, f) {
    if (obj instanceof Array) {
        let keys = obj
        let o = {}
        for (let key of keys) {
            o[key] = f(key)
        }
        return o
    }
}

// will regenerate key
export function keyValueRemap(obj, f) {
    let o = {}
    for (let key in obj) {
        let [mapKey, mapValue] = f(key, obj[key])
        o[mapKey] = mapValue
    }
    return o
}

// valueRemap generates new value based on key & value
export function valueRemap(obj, f) {
    let o = {}
    for (let key in obj) {
        o[key] = f(obj[key], key)
    }
    return o
}

// remap to object
export function remapValue(obj, f) {
    let o = {}
    for (let key in obj) {
        o[key] = f(obj[key], key)
    }
    return o
}

export function range(n) {
    let array = Array(n).fill(0).map((_, i) => i)
    array.remap = (f) => remap(array, f)
    return array
}

export function methods(o, includePrivate) {
    let names = Object.getOwnPropertyNames(Object.getPrototypeOf(o))
    let methods = {}
    for (let name of names) {
        if (!includePrivate && name.startsWith("_")) {
            continue
        }
        let prop = o[name]
        if (!prop) {
            continue
        }

        if (prop instanceof Function) {
            methods[name] = prop
        }
    }
    return methods
}