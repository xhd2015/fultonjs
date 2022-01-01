import { snakeCase } from "voca"
import { escapeId } from 'mysql';
import { validate, validateArrayNotEmpty, validateObjectAtLeastOneKey } from "./validate";
import util from "util"


const likeModes = [{
    mode: "$contains",
    start: "%",
    end: "%"
}, {
    mode: "$starts_with",
    start: "",
    end: "%"
}, {
    mode: "$ends_with",
    start: "%",
    end: ""
}
]
const unaryOperators = [{
    operator: "$lt",
    sql: "<",
}, {
    operator: "$lte",
    sql: "<="
}, {
    operator: "$gt",
    sql: ">"
}, {
    operator: "$gte",
    sql: ">="
}, {
    operator: "$eq",
    sql: "="
}, {
    operator: "$neq",
    sql: "!="
}, {
    operator: "$in",
    sql: "IN",
    placeholder: "(?)"
}, {
    operator: "$nin",
    sql: "NOT IN",
    placeholder: "(?)"
}]
// options: useSnakeCase(default:true)
export class ORM {
    constructor(db, options) {
        this.db = db
        let { useSnakeCase = true } = options || {}
        this.options = { useSnakeCase }
        this.table = undefined
    }

    withDB(db) {
        let orm = new ORM(db, this.options)
        orm.table = this.table
        return orm
    }
    withTable(table) {
        let orm = new ORM(this.db, this.options)
        orm.table = table
        return orm
    }
    // keepNull: keep null value
    normalizeModel(model, keepNull) {
        if (model === undefined) {
            return undefined
        }
        let checkedModel = {}
        for (let key in model) {
            let checkedValue = model[key]
            if (checkedValue == null && !keepNull) {
                continue // skip undefined
            }
            // skip function properties
            if (checkedValue instanceof Function) {
                continue
            }
            let checkedKey = this.options.useSnakeCase ? snakeCase(key) : key
            checkedModel[checkedKey] = this.truncateDate(checkedValue)
        }
        return checkedModel
    }
    truncateDate(date) {
        if (date instanceof Date) {
            date.setMilliseconds(0)
        }
        return date
    }
    // mode: $contains, $starts_with, $ends_with
    _processLikeClause(mode, model, key, word, conditions, args, start, end) {
        if (typeof word === 'string') {
            word = [word]
        }
        if (Array.isArray(word)) {
            const likes = word.filter(e => e != null && e != "").map(e => {
                args.push(key, start + e + end)
                return "?? LIKE ?"
            })
            conditions.push("(" + likes.join(" AND ") + ")")
        } else {
            throw new Error(util.format("bad %s condition, expecting string or array,found:%j, key = %s, model = %j", mode, word, key, model))
        }
    }
    // return {condition, args}
    // supports:
    // {
    //    "key":"value",  // key = value
    //    "key":[1,2], // key IN (1,2)   
    //    "key":{
    //        "$contains":"A" or ["A","B"] // (key LIKE "%A%" AND key LIKE "%B%")
    //     }
    //    "key":{
    //        "$startsWith":"A" or ["A","B"] // (key LIKE "A%" AND key LIKE "B%")
    //     }
    //    "key":{
    //        "$endsWith":"A" or ["A","B"] // (key LIKE "%A" AND key LIKE "%B")
    //     }
    // }
    // keepNull:  true = keep null key, false = do not keep null
    modelToConditions(model,keepNull) {
        let conditions = []
        let args = []
        for (let key in model) {
            let value = model[key]
            // do not use isNaN on array
            // NOTE: NaN == null => false
            // isNaN([]) = false, isNaN([1]) = false, isNaN([1,2,3]) = true
            // if (model[key] === undefined || isNaN(model[key]) || model[key] == null) {
            if(value == null/* null or undefined */ ){
                if(!keepNull){
                    continue
                }
                conditions.push(this.quoteName(key) + " IS NULL")
                continue
            }
            // check invalid number
            const valueType = typeof value
            if (valueType === 'number' && isNaN(value)) {
                continue
            }
            if (!Array.isArray(value)) {
                // console.log("found object:", key, value)
                if (valueType === 'object') {
                    for (let like of likeModes) {
                        let word = value[like.mode]
                        if (word) {
                            this._processLikeClause(like.mode, model, key, word, conditions, args, like.start, like.end)
                            break
                        }
                    }
                    for (let unaryOp of unaryOperators) {
                        let unaryValue = value[unaryOp.operator]
                        if (unaryValue != null) {
                            conditions.push(`${this.quoteName(key)} ${unaryOp.sql} ${unaryOp.placeholder || "?"} `)
                            args.push(unaryValue)
                        }
                    }
                    continue
                } else {
                    conditions.push(this.quoteName(key) + " = ?")
                }
            } else {
                // is array
                if (value.length === 0) {
                    // not possible to find one
                    throw new Error(util.format("empty array condition: key = %s, model = %j", key, model))
                }
                conditions.push(this.quoteName(key) + " IN (?)")
            }
            args.push(value)
        }
        // console.log("return condition args:", conditions, args)
        return { conditions, args }
    }

    quoteName(name) {
        return escapeId(name)

        // let split = name.split(".")
        // if (split && split.length == 2) {
        //     return "`" + split[0] + "`.`" + split[1] + "`"
        // } else {
        //     return "`" + name + "`"
        // }
    }

    // Date's milliseconds are auto truncated 
    async insert(model) {
        if (!this.db) {
            throw new Error("no db specified")
        }
        if (!this.table) {
            throw new Error("no table specified")
        }
        const checkedModel = this.normalizeModel(model)
        return await this.db.execute("INSERT INTO ?? SET ?", [this.table, checkedModel])
    }

    async insertMany(models) {
        if (!this.db) {
            throw new Error("no db specified")
        }
        if (!this.table) {
            throw new Error("no table specified")
        }
        const actions = []
        for (let model of models) {
            const checkedModel = this.normalizeModel(model)
            actions.push(this.db.execute("INSERT INTO ?? SET ?", [this.table, checkedModel]))
        }
        return Promise.all(actions)
    }

    _getUpdateSQL(model, where, options) {
        const {keepNull} = options || {}
        if (!where || Object.keys(where).length === 0) {
            throw new Error("no condition specified for update")
        }
        if (!model || Object.keys(model).length === 0) {
            throw new Error("no fields of data to update")
        }
        const checkedModel = this.normalizeModel(model,keepNull)
        let { conditions, args } = this.modelToConditions(where)
        return { sql: "UPDATE ?? SET ? WHERE " + conditions.join(" AND "), args: [this.table, checkedModel, ...args] }
    }

    _getDeleteSQL(where) {
        if (!where || Object.keys(where).length === 0) {
            throw new Error("no condition specified for update")
        }
        let { conditions, args } = this.modelToConditions(where)
        return { sql: "DELETE FROM ?? WHERE " + conditions.join(" AND "), args: [this.table, ...args] }
    }

    // all existent value will be update
    // empty value not filtered
    async update(model, where,options) {
        if (!this.db) {
            throw new Error("no db specified")
        }
        if (!this.table) {
            throw new Error("no table specified")
        }
        let { sql, args } = this._getUpdateSQL(model, where,options)
        return await this.db.execute(sql, args)
    }
    // data:[{where,data}]
    async updateMany(data,options) {
        if (!this.db) {
            throw new Error("no db specified")
        }
        if (!this.table) {
            throw new Error("no table specified")
        }
        validateArrayNotEmpty({ data })
        let sqlArgs = data.map(({ data, where }) => this._getUpdateSQL(data, where,options))
        return Promise.all(sqlArgs.map(({ sql, args }) => this.db.execute(sql, args)))
    }
    async deleteWhere(where) {
        validateObjectAtLeastOneKey({ where })
        const { sql, args } = this._getDeleteSQL(where)
        return await this.db.execute(sql, args)
    }
    // async deleteMany(data) {
    //     if (!this.db) {
    //         throw new Error("no db specified")
    //     }
    //     if (!this.table) {
    //         throw new Error("no table specified")
    //     }
    //     validateArrayNotEmpty({data})
    //     let sqlArgs = data.map(({ data, where }) => this._getUpdateSQL(data, where))
    //     return Promise.all(sqlArgs.map(({ sql, args }) => this.db.execute(sql, args)))
    // }

    // must have id field
    // return 0=insert, 1=update
    // options:
    async insertOrUpdate(model, where, options) {
        let { idField = "id" , keepNull} = options || {}
        if (!idField) {
            throw new Error("idField cannot be empty")
        }
        if (!this.db) {
            throw new Error("no db specified")
        }
        if (!this.table) {
            throw new Error("no table specified")
        }
        if (!where) {
            throw new Error("no condition specified for update")
        }
        // even there is no unique key constraint, this should be success
        const checkedModel = this.normalizeModel(model,keepNull)
        const { conditions, args } = this.modelToConditions(where)
        return await this.db.newTransaction(async tx => {
            let data = await tx.query("SELECT ?? FROM ?? WHERE " + conditions.join(" AND "), [idField, this.table, ...args])
            if (data.length > 1) {
                throw new Error("internal error, number of data exceeds 1:" + data.length)
            }
            if (data.length === 0) {
                // TODO: there is some case, two transactions 
                // have both inserted the data, without unique 
                // key there is not conflict
                // in this case the insertOrUpdate semantic depends
                // more on a periodic task to scan repeated rows 
                // and refine them
                let res = await tx.execute("INSERT INTO ?? SET ?", [this.table, checkedModel])
                return res.insertId
            } else {
                let id = data[0][idField]
                if (!id) {
                    throw new Error("cannot get id of existing data:" + data[0])
                }
                delete checkedModel[idField]
                await tx.execute("UPDATE ?? SET ? WHERE ?? = ?", [this.table, checkedModel, idField, id])
                return id
            }
        })
    }
    // data: [{model, where}]
    // example: insertOrUpdateMany(tx,["name"],[{}], "id",[1,2,3])
    async insertOrUpdateMany(tx, key, data, idField, ids, options) {
        const { createPreset, updatePreset,keepNull } = options || {}
        validate({ tx, idField })
        validateArrayNotEmpty({ key, data, ids })
        if (ids.length < data.length) {
            throw new Error(util.format("insertOrUpdateMany:ids.length=%s < data.length=%s, may not be enough!", ids.length, data.length))
        }
        if (!this.table) {
            throw new Error("no table specified")
        }
        // validate data and where
        const items = data.map((model, idx) => {
            validateObjectAtLeastOneKey({ [`data[${idx}]`]: model })
            const where = {}
            key.forEach(k => where[k] = model[k])
            // conditions cannot be empty
            const { conditions, args } = this.modelToConditions(where)
            if (conditions.length === 0) {
                throw new Error("conditions empty")
            }
            return { model, conditions, args }
        })
        const result = items.map(async ({ model, conditions, args }, idx) => {
            return await this._doInsertOrUpdate(tx, idField, model, conditions, args, ids[idx], createPreset, updatePreset,{keepNull})
        })
        return await Promise.all(result)
    }
    // options.keepNull -- set true by these who filter value by themself
    async _doInsertOrUpdate(tx, idField, model, conditions, args, id, createPreset, updatePreset,options) {
        // even there is no unique key constraint, this should be success
        const checkedModel = this.normalizeModel(model, options?.keepNull)
        let data = await tx.query("SELECT ?? FROM ?? WHERE " + conditions.join(" AND "), [idField, this.table, ...args])
        if (data.length > 1) {
            throw new Error("internal error, number of data exceeds 1:" + data.length)
        }
        if (data.length === 0) {
            // TODO: there is some case, two transactions 
            // have both inserted the data, without unique 
            // key there is not conflict
            // in this case the insertOrUpdate semantic depends
            // more on a periodic task to scan repeated rows 
            // and refine them
            Object.assign(checkedModel, createPreset, updatePreset)
            checkedModel.id = id
            await tx.execute("INSERT INTO ?? SET ?", [this.table, checkedModel])
            return { type: "insert", id }
        } else {
            id = data[0][idField]
            if (!id) {
                throw new Error("cannot get id of existing data:" + data[0])
            }
            Object.assign(checkedModel, updatePreset)
            delete checkedModel[idField]
            await tx.execute("UPDATE ?? SET ? WHERE ?? = ?", [this.table, checkedModel, idField, id])
            return { type: "update", id }
        }
    }

    // options: {orderBy:[...]}
    // options = {orderBy, fields:[] or string , limit, offset}
    async find(where, options) {
        if (!this.table) {
            throw new Error("no table specified")
        }
        // order by must appear before limit
        // order by ... limit ...
        let { orderBy, fields, limit, offset } = options || {}
        // TODO: sql injection
        if (orderBy) {
            orderBy = " ORDER BY " + orderBy
        } else {
            orderBy = ""
        }
        let sqlFields = "*"
        if (fields) {
            if (typeof fields === 'string') {
                sqlFields = fields
            } else if (fields.length > 0) {
                sqlFields = fields.map(field => this.quoteName(field)).join(",")
            }
        }
        let limitClause = ""
        const limitValid = limit > 0
        const offsetValid = offset > 0
        if (limitValid && !offsetValid) {
            limitClause = " LIMIT " + limit
        } else if (!limitValid && offsetValid) {
            throw new Error("cannot specify offset without a valid limit: offset = " + offset + ", limit = " + limit)
        } else if (limitValid && offsetValid) {
            limitClause = " LIMIT " + offset + "," + limit
        }
        let returnNoWhere = async () => {
            return await this.db.query("SELECT " + sqlFields + " FROM ??" + orderBy + limitClause, [this.table])
        }
        if (where == null) {
            return await returnNoWhere()
        }
        // where is object
        if (!Array.isArray(where)) {
            if (Object.keys(where).length === 0) {
                return await returnNoWhere()
            }
            let checkedModel = this.normalizeModel(where)
            if (checkedModel === undefined) {
                return await returnNoWhere()
            } else {
                let { conditions, args } = this.modelToConditions(checkedModel)
                if (conditions?.length === 0) {
                    return await returnNoWhere()
                }
                return await this.db.query("SELECT " + sqlFields + " FROM ?? WHERE " + conditions.join(" AND ") + orderBy + limitClause, [this.table, ...args])
            }
        }
        // is array
        let conditions = []
        let args = [this.table]
        for (let keyValue of where) {
            if (keyValue == null) {
                continue
            }
            if (keyValue instanceof String) {
                conditions.push(keyValue)
                continue
            }
            conditions.push(keyValue[0])
            if (keyValue.length > 1) {
                args.push(this.truncateDate(keyValue[1]))
            }
        }
        if (conditions.length === 0) {
            return await returnNoWhere()
        }
        // console.log("conditions:", conditions)
        // console.log("args:", args)
        return await this.db.query("SELECT " + sqlFields + " FROM ?? WHERE " + conditions.join(" AND ") + orderBy + limitClause, args)
    }
    // options = {orderBy, fields:[] or string }
    async findOne(where, options) {
        let result = await this.find(where, options)
        return result[0]
    }
    async count(where) {
        const data = await this.findOne(where, { fields: "COUNT(*)" })
        return data?.[Object.keys(data)?.[0]]
    }
}