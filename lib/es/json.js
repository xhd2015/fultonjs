import JSONBig from "json-bigint"

// useNativeBigInt: use builtin BigInt
// storeAsString: when big int encountered, use string
const JSONUtil = JSONBig({ useNativeBigInt: true, storeAsString: true })

export function tryParseJSON(json, defaultVaue) {
    if (json && typeof json === 'string') {
        try {
            return JSON.parse(json)
        } catch (e) {
            // ignore
        }
    }
    return defaultVaue
}

export function tryParseJSONSafeBigint(json, defaultVaue) {
    if (json && typeof json === 'string') {
        try {
            return parseJSONSafeBigint(json)
        } catch (e) {
            // ignore
        }
    }
    return defaultVaue
}

// options = {}
export function parseJSONSafeBigint(json) {
    return JSONUtil.parse(json)
}
export function stringifyJSONSafeBigint(object) {
    return JSONUtil.stringify(object)
}