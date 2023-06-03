import * as JSONBigInt from 'json-bigint';
const { parse: JSONBigIntParse, stringify: JSONBigIntStringify } = JSONBigInt({
    protoAction: 'preserve',
    constructorAction: 'preserve'
});
export function parseJSONObjectSafe(code) {
    return JSONBigIntParse(code);
}
export function prettyJSONObjectSafe(object) {
    return JSONBigIntStringify(object, null, "    ");
}
export function compressJSONObjectSafe(object) {
    return JSONBigIntStringify(object);
}
