export class Pool {
    constructor(size: any, checkInterval: any);
    _cap: any;
    _size: number;
    _closed: boolean;
    _queue: any[];
    _checker: number;
    withinPool(fn: any): Promise<any>;
    close(): Promise<void>;
}
