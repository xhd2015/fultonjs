export class AsyncCacher {
    constructor(loader: any, ttl: any, onCacheLoaded: any);
    loader: any;
    ttl: any;
    cache: {};
    onCacheLoaded: any;
    get(key: any): Promise<any>;
    set(key: any, value: any): Promise<void>;
    invalidate(key: any): Promise<void>;
    _loadOne(key: any): Promise<any>;
}
