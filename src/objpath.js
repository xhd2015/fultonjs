function toSegments(path) {
    return path && typeof path === 'string' ? path.split(".") : path
}

export const DEL = {}
// path: string or array of string
// options: {nullSafe:true(default)|false}
// if options.nullSafe, then return undefined when there is a null object
export function get(o, path, options) {
    path = toSegments(path)
    let node = o
    for (let i = 0; i < path.length; i++) {
        let seg = path[i]
        if (!seg) {
            let hint = i === 0 ? "begining of " + path : path.slice(0, i).join(".")
            throw new Error("empty key at " + hint)
        }
        if (node == null) {
            if (!options || options.nullSafe !== false) {
                return undefined
            }
            throw new ReferenceError(seg)
        }
        node = node[seg]
    }
    return node
}

// path: string or array of string
// options: {nullSafe:true(default)|false}
// if options.nullSafe, then set object when there is a null object
// if value is DEL, then the property is deleted
export function set(o, path, value, options) {
    path = toSegments(path)
    if (path.length === 0) {
        throw new Error("must have path")
    }
    let last
    let endNode = o
    // locating its endNode, where endNode is the last node that
    // navigates to the last segment of the path
    // invariant: endNode == null || endNode[path[i]]->value
    for (let i = 0; i < path.length; i++) {
        let seg = path[i]
        if (!seg) {
            let hint = i === 0 ? "begining of " + path : path.slice(0, i).join(".")
            throw new Error("empty key at " + hint)
        }
        if (endNode == null) {
            if (value === DEL) {
                return o
            }
            if (options && options.nullSafe === false) {
                throw new ReferenceError(seg)
            }
            endNode = {}
            if (i === 0) {
                o = endNode // root
            } else {
                last[path[i - 1]] = endNode // an intermediate node
            }
        }
        if (i === path.length - 1) { //last
            if (value === DEL) {
                delete endNode[seg]
            } else {
                endNode[seg] = value
            }
            break
        }
        last = endNode
        endNode = endNode[seg]// next
    }
    return o
}

export function del(o, path, options) {
    return set(o, path, DEL, options)
}

export function assign(dst, src, options) {
    for (let key in src) {
        dst = set(dst, key, src[key], options)
    }
    return dst
}