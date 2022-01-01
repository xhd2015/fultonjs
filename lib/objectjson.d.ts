export function JSONObject(value: any, options: any): void;
export class JSONObject {
    constructor(value: any, options: any);
    json: any;
}
export class StringJSONObject {
    /**
     *
     * @param {*} object  can be null
     * @param {object} options
     * -   options.stringify     define how to stringify a object
     * -   options.parse         define how to parse a string
     */
    constructor(object: any, options: object);
    _object: any;
    _json: any;
    _stringify: any;
    _parse: any;
    _silent: any;
    set object(arg: any);
    get object(): any;
    set json(arg: any);
    get json(): any;
}
