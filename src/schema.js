const { deepcopy, deepclean, deepextends } = require("./object")
const { InvalidArgumentsError } = require('./error');


export const ROOT = "$root"
export const ROOT_UNDERSCORE = "_$root"
export const ROOT_PREFIX = ROOT + "."
export const ROOT_PREFIX_UNDERSCORE = ROOT_UNDERSCORE + "."
export const IGNORE = "$ignore"

// just possible fields
export const ROOT_FIELDS = {
    id: {
        type: "int64"
    },
    creator: {

    },
    updater: {

    },
    create_time: {

    },
    update_time: {

    },
    deleted: {
        // optional, only for mysql
    }
}

/**
 * 
 * @param {*} type 
 * @param {function} schemaNameToType   async schemaNameToType(name) => schema type
 * @param {function} configuredSchemaGetterByType  async configuredSchemaGetterByType(type) => raw schema
 * @returns merged and simplified schema
 */
export async function mergeSchemaExtends(type, schemaNameToType, configuredSchemaGetterByType) {
    if (!schemaNameToType || !configuredSchemaGetterByType) {
        throw new InvalidArgumentsError("must provide schemaNameToType && configuredSchemaGetterByType")
    }
    let schema = await configuredSchemaGetterByType(type)
    if (!schema) {
        return undefined
    }
    // clean schema
    delete schema._id  // _id, ObjectId(...), should not be copied
    schema = deepcopy(schema)

    const foundSchemaName = {}
    foundSchemaName[schema.name] = true
    let chainRoot = {}
    let chain = chainRoot
    const nameToSchemaResolver = async (name) => {
        const schemaType = await schemaNameToType(name)
        if (!schemaType) {
            throw new Error("bad schema configuration, extension not found:" + name)
        }
        let extendedSchema = await configuredSchemaGetterByType(schemaType)
        if (!extendedSchema) {
            throw new Error("bad schema configuration, extension not found:" + name)
        }
        delete extendedSchema._id  // _id, ObjectId(...), should not be copied
        return deepcopy(extendedSchema)
    }
    const mergeSchemaExtends = async (subsShema, parentSchema) => {
        // 1.
        // A extends (B extends C) = (A extends B) extends C
        // why?
        // let R be the final result, R.x = R(A.x,B.x,C.x)
        // R(A.x,B.x,C.x) = R(A.x, R(B.x,C.x))
        //                = R(R(A.x,B.x),C.x)
        // 2.
        // A extends B, A extends C
        // R.x = R(R(A.x, B.x), C.x)
        //     = 
        const parentExtends = parentSchema["extends"]
        if (parentExtends) {
            if (!Array.isArray(parentExtends)) { // string
                await mergeNextNamedSchema(parentSchema,parentExtends)
            } else {
                // sequential
                for(let ext of parentExtends){
                    await mergeNextNamedSchema(parentSchema,ext)
                }
            }
        }
        // ignore extends
        deepextends(subsShema, {...parentSchema, extends:undefined })
    }
    const mergeNextNamedSchema = async (subsShema,name) => {
        if (foundSchemaName[name]) {
            // we cannot detect circle here, we just do a mark
            return
            // throw new Error("bad schema configuration, circle reference found:" + name)
        }
        foundSchemaName[name] = true
        const parentSchema = await nameToSchemaResolver(name)
        await mergeSchemaExtends(subsShema,parentSchema)
    }

    let resultSchema = {}
    // starting from initial schema
    await mergeSchemaExtends(resultSchema,schema)
    // // await dynamic
    // let awaitChain = chainRoot
    // while (awaitChain) {
    //     await awaitChain.action()
    //     awaitChain = awaitChain.next
    // }

    // accerlate later schema usage
    resultSchema = inflateSchema(resultSchema)
    // console.log("merged schema")
    //  remove null or undefined values
    resultSchema = deepclean(resultSchema)
    return resultSchema
}

/**
 * inflate schema, so that one field may expand to
 * multiple related fields
 * @param {*} mergedSchema 
 */
export function inflateSchema(mergedSchema) {
    const fields = mergedSchema.fields

    // merge audit
    const audit = mergedSchema.audit
    for (let name in audit) {
        const auditInfo = audit[name]
        if (auditInfo && auditInfo.nodes) {
            if (Array.isArray(auditInfo.nodes)) {
                // for back compitability, support array
                for (let nodeInfo of auditInfo.nodes) {
                    if (nodeInfo) {
                        mergeAuditFieldsInPlace(fields, nodeInfo)
                    }

                }

            } else {
                Object.keys(auditInfo.nodes).forEach(name => {
                    const nodeInfo = auditInfo.nodes[name]
                    if (nodeInfo) {
                        mergeAuditFieldsInPlace(fields, nodeInfo)
                    }

                })
            }
        }
    }

    // field map separate to $root and common fields
    const persistence = mergedSchema.persistence
    for (let name in persistence) {
        const info = persistence[name]
        if (info) {
            // normalize
            info.fieldMap = normalizeFieldMap(fields, info.fieldMap)
            // build reversed map
            // info.storeFieldMap = buildStoreFieldMap(info.fieldMap)
        }
    }

    return mergedSchema
}

// only merge present fields
// returns nothing
function mergeAuditFieldsInPlace(fields, nodeInfo) {
    let auditFields
    if (nodeInfo?.type === 'review_tcs' && (auditFields = nodeInfo?.audit_schema?.fields)) {
        for (let field in auditFields) {
            if (auditFields[field] != null) {
                const fieldInfo = fields[field]
                if (fieldInfo) {
                    // deepcopy for safety reason
                    auditFields[field] = deepcopy(deepextends(auditFields[field], fieldInfo))
                }
            }
        }
    }
}
// $root, _$root
// $root.xx, _$root.xx are all merged
// => 
// {
//   "_$root":{...}
//   ....
// }
function normalizeFieldMap(fields, fieldMap) {
    const rootMap = {}
    const cleanFieldMap = {}
    let wholeRootMap // has lower priority
    for (let field in fieldMap) {
        if (field === ROOT || field === ROOT_UNDERSCORE) {
            if (!wholeRootMap) {
                wholeRootMap = fieldMap[field]
            } else {
                Object.assign(wholeRootMap, fieldMap[field])
            }
        } else if (field.startsWith(ROOT_PREFIX)) {
            const rootField = field.slice(ROOT_PREFIX.length)
            rootMap[rootField] = fieldMap[field]
        } else if (field.startsWith(ROOT_PREFIX_UNDERSCORE)) {
            const rootField = field.slice(ROOT_PREFIX_UNDERSCORE.length)
            rootMap[rootField] = fieldMap[field]
        } else {
            // simply copy
            cleanFieldMap[field] = fieldMap[field]
        }
    }

    // if fieldMap is empty, then this contains a full map
    // data fields that not changed
    // for (let field in fields) {
    //     if (!(field in cleanFieldMap)) {
    //         cleanFieldMap[field] = field
    //     }
    // }

    // assign root field if missing
    for (let rootField in wholeRootMap) {
        if (!(rootField in rootMap)) {
            rootMap[rootField] = wholeRootMap[rootField]
        }
    }

    // root field that is not changed
    // for (let rootField in ROOT_FIELDS) {
    //     if (!(rootField in rootMap)) {
    //         rootMap[rootField] = rootField
    //     }
    // }

    // remove $IGNORE or {ignore:true}
    for (let field in cleanFieldMap) {
        if (cleanFieldMap[field] === IGNORE || cleanFieldMap[field].ignore) {
            cleanFieldMap[field] = IGNORE
        }
    }
    for (let field in rootMap) {
        if (rootMap[field] === IGNORE || rootMap[field].ignore) {
            rootMap[field] = IGNORE
        }
    }
    // compose them
    cleanFieldMap[ROOT_UNDERSCORE] = rootMap
    return cleanFieldMap
}

function buildStoreFieldMap(normalizedFieldMap) {
    const map = {}
    for (let field in normalizedFieldMap) {
        if (field === ROOT_UNDERSCORE) {
            continue
        }
        if (normalizedFieldMap[field] === IGNORE) {
            continue
        }
        map[normalizedFieldMap[field]] = field
    }
    const rootMap = {}
    const normalizedRootMap = normalizedFieldMap[ROOT_UNDERSCORE]
    for (let field in normalizedRootMap) {
        if (normalizedRootMap[field] === IGNORE) {
            continue
        }
        rootMap[normalizedRootMap[field]] = field
    }
    map[ROOT_UNDERSCORE] = rootMap
    return map
}
function buildStoreToViewFieldMap(fieldMap) {
    let hasRootMap = false
    let hasDataMap = false
    let rootMap = {}
    let dataMap = {}
    for (let field in fieldMap) {
        if (field === ROOT || field === ROOT_UNDERSCORE) {
            for (let rootField in fieldMap[field]) {
                hasRootMap = true
                rootMap[fieldMap[field][rootField]] = rootField
            }
        } else if (field.startsWith("$root.")) {
            hasRootMap = true
            const rootField = field.slice("$root.".length)
            rootMap[fieldMap[field]] = rootField
        } else if (field.startsWith("_$root.")) {
            hasRootMap = true
            const rootField = field.slice("_$root.".length)
            rootMap[fieldMap[field]] = rootField
        } else {
            hasDataMap = true
            dataMap[fieldMap[field]] = field
        }
    }
    if (!hasRootMap) {
        rootMap = undefined
    }
    if (!hasDataMap) {
        dataMap = undefined
    }
    return { rootMap, dataMap }
}


const intTypes = ["int64", "int", "int32", "int16", "int8"]
export function mergeLaplaceFields(fields, laplaceFields) {
    if (!laplaceFields) {
        return []
    }
    // extended and copied
    laplaceFields = deepcopy(deepextends(laplaceFields, fields))
    // define the 'field' property for list
    let fieldList = Object.keys(laplaceFields).map(field => {
        const info = laplaceFields[field]
        if (!info) {
            return info
        }
        if (!info.field) {
            info.field = "data." + field
        } else if (info.field.startsWith(ROOT_PREFIX)) {
            info.field = info.field.slice(ROOT_PREFIX.length)
        }
        return info
    })

    // convert [int64,int,int32,int16,int8] to number
    fieldList.forEach(field => {
        if (intTypes.includes(field.type)) {
            field.type = 'number'
        } else if (field.type == 'string') {
            field.type = 'text'
        }
    })

    // sort by order
    fieldList = sortByOrder(fieldList)

    return fieldList
}


// the fields defined in the database may have convienent form
// adapt it to the form accepted by DataTable
// - schema.fields                       all fields
// - schema.laplace.fields               displaying fields,will be sorted
// - schema.laplace.permission           permission configs
//       {
//           "base":"", // base prefix, empty means no permission validation
//           "map":{
//                "import":"", // 批量导入
//                "select":"", // 可多选
//                "add":"", // 可添加
//                "edit":"", // 可更新
//                "delete":"", // 可删除
//            }
//       }
// returns: {name, fields:[],permission}
export function getDisplaySchema(schema) {
    const fields = mergeLaplaceFields(schema.fields, schema.laplace?.field)
    const laplace = deepcopy(schema.laplace)
    laplace.fields = fields
    // cleaned
    return deepclean(laplace)
}

// sort by order, smaller order first
// if order is not present, it is considered the lowest priority
export function sortByOrder(list) {
    return list?.sort((a, b) => {
        let orderA = Number(a.order) || Number.MAX_SAFE_INTEGER
        let orderB = Number(b.order) || Number.MAX_SAFE_INTEGER
        return orderA - orderB
    })
}