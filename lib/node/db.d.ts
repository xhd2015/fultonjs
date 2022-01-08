export class DB {
    constructor(options: any);
    pool: any;
    getConnection: any;
    newConnection(): Promise<Connection>;
    withConnection(f: any): any;
    newTransaction(fn: any): any;
    query(sql: any, args: any): Promise<any>;
    queryOne(sql: any, args: any): Promise<any>;
    count(sql: any, args: any): Promise<any>;
    execute(sql: any, args: any): Promise<any>;
}
export class Connection {
    constructor(conn: any);
    conn: any;
    getConnection(): any;
    query(sql: any, args: any): Promise<any>;
    queryOne(sql: any, args: any): Promise<any>;
    count(sql: any, args: any): Promise<any>;
    execute(sql: any, args: any): Promise<any>;
}
