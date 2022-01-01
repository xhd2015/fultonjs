/**
 *
 * @param {*} type
 * @param {function} schemaNameToType   async schemaNameToType(name) => schema type
 * @param {function} configuredSchemaGetterByType  async configuredSchemaGetterByType(type) => raw schema
 * @returns merged and simplified schema
 */
export function mergeSchemaExtends(type: any, schemaNameToType: Function, configuredSchemaGetterByType: Function): Promise<{}>;
/**
 * inflate schema, so that one field may expand to
 * multiple related fields
 * @param {*} mergedSchema
 */
export function inflateSchema(mergedSchema: any): any;
export function mergeLaplaceFields(fields: any, laplaceFields: any): any[];
export function getDisplaySchema(schema: any): any;
export function sortByOrder(list: any): any;
export const ROOT: "$root";
export const ROOT_UNDERSCORE: "_$root";
export const ROOT_PREFIX: string;
export const ROOT_PREFIX_UNDERSCORE: string;
export const IGNORE: "$ignore";
export namespace ROOT_FIELDS {
    namespace id {
        const type: string;
    }
    const creator: {};
    const updater: {};
    const create_time: {};
    const update_time: {};
    const deleted: {};
}
