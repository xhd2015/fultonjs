export class AsyncCacher {
    constructor(loader: any, ttl: any, onCacheLoaded: any, options: any);
    loader: any;
    ttl: any;
    cache: {};
    onCacheLoaded: any;
    _useExpired: boolean;
    _limit: any;
    _keyFIFO: any[];
    _refreshInterval: any;
    _refreshLimit: any;
    _onCacheEvicted: any;
    _onRefresherRun: any;
    _shouldCacheNull: boolean;
    _size: number;
    get(args: any): Promise<any>;
    getKey(args: any): any;
    set(args: any, value: any): Promise<void>;
    invalidate(args: any): void;
    _deleteKey(key: any): void;
    _loadOne(args: any): Promise<any>;
    _checkEvict(): void;
    _callOnCacheLoadedCallback(args: any, v: any): Promise<void>;
    /**
     *
     * @public
     * @returns
     */
    public get size(): number;
    /**
     *
     * @public
     * @returns
     */
    public get keys(): string[];
    /**
     * stop all refreshers, if any
     * @public
     * @returns
     */
    public destroy(): void;
}
