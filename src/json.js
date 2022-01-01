import JSONBig from "json-bigint"

// useNativeBigInt: use builtin BigInt
// storeAsString: when big int encountered, use string
const JSONUtilBigint = JSONBig({ useNativeBigInt: true })
const JSONUtilString = JSONBig({ useNativeBigInt: true, storeAsString: true })

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
export function parseJSONSafeBigint(json, ...options) {
    return JSONUtilString.parse(json, ...options)
}
export function stringifyJSONSafeBigint(object,...options) {
    return JSONUtilString.stringify(object,...options)
}

// pretty the content
export function prettyJSON(content) {
    if (content) {
        return JSONUtilBigint.stringify(
            JSONUtilBigint.parse(content),
            undefined,
            "    "
        );
    }
    return content
}
export function prettyObject(object) {
    return JSONUtilBigint.stringify(object,
        undefined,
        "    "
    );
}