export function genThriftToJSON(thriftFile: any, jsonFile: any): void;
export function genMethodsSchema(jsonFile: any): void;
export function genThriftMethodsSchema(thriftFile: any, dir: any): void;
export function callThrift(psm: any, method: any, args: any, settings: any): Promise<any>;
export function callThriftByFile(psm: any, method: any, args: any, base: any, options: any): Promise<any>;
