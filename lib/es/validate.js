
class InvalidArgumentsError extends Error {
    constructor(msg) {
        super(msg)
    }
}

// options = {key:{arrayNotEmpty:true|false}}
// options.$ignore: [keys]
export function validate(obj, options) {
    let ignore  = options && options["$ignore"]
    for (let key in obj) {
        if (ignore && ignore.includes(key)) {
            continue
        }
        // NaN is invalid also
        if (!obj[key]) {
            throw new InvalidArgumentsError("requires " + key)
        }
        if (options && options[key] && options.arrayNotEmpty) {
            if (!Array.isArray(obj[key]) || obj[key].length === 0) {
                throw new InvalidArgumentsError("requires " + key + " not empty array")
            }
        }
    }
}
