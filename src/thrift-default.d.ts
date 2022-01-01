export class Schema {
    constructor(schema: any);
    schema: any;
    structMapping: {};
    enumMapping: {};
    constantMapping: {};
    typedefsMapping: {};
    servicesMapping: {};
    genServiceFunctionsDefault(service: any, options: any, ...args: any[]): {
        name: any;
        returnType: {
            type: any;
            default: any;
        };
        arguments: any[];
    }[];
    _genTypeDefault(valueMap: any, type: any, indent: any, options: any): any;
}
