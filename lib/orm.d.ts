export class ORM {
    constructor(db: any, options: any);
    db: any;
    options: {
        useSnakeCase: any;
    };
    table: any;
    withDB(db: any): ORM;
    withTable(table: any): ORM;
    normalizeModel(model: any, keepNull: any): {};
    truncateDate(date: any): any;
    _processLikeClause(mode: any, model: any, key: any, word: any, conditions: any, args: any, start: any, end: any): void;
    modelToConditions(model: any, keepNull: any): {
        conditions: string[];
        args: any[];
    };
    quoteName(name: any): any;
    insert(model: any): Promise<any>;
    insertMany(models: any): Promise<any[]>;
    _getUpdateSQL(model: any, where: any, options: any): {
        sql: string;
        args: any[];
    };
    _getDeleteSQL(where: any): {
        sql: string;
        args: any[];
    };
    update(model: any, where: any, options: any): Promise<any>;
    updateMany(data: any, options: any): Promise<[any, any, any, any, any, any, any, any, any, any]>;
    deleteWhere(where: any): Promise<any>;
    insertOrUpdate(model: any, where: any, options: any): Promise<any>;
    insertOrUpdateMany(tx: any, key: any, data: any, idField: any, ids: any, options: any): Promise<[any, any, any, any, any, any, any, any, any, any]>;
    _doInsertOrUpdate(tx: any, idField: any, model: any, conditions: any, args: any, id: any, createPreset: any, updatePreset: any, options: any): Promise<{
        type: string;
        id: any;
    }>;
    find(where: any, options: any): Promise<any>;
    findOne(where: any, options: any): Promise<any>;
    count(where: any): Promise<any>;
}
