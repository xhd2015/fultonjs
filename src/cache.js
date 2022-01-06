
const StatusInitLoading = 1
const StatusExpireLoading = 2
const StatusLoaded = 3


function argsToKey(args) {
    if (typeof args !== 'object') {
        return args // args as key
    }
    const key = Object.keys(args || {}).sort().map(k => `${k}=${args[k] === undefined || args[k] === null ? '' : args[k]}`).join("&")
    if (!key) {
        throw new Error("invalid empty args")
    }
    return key
}

// cache entry prototype:
// class AsyncCacheEntry {
//     constructor(status) {
//         this.status = StatusExpireLoading
//         this.value = null
//         this.time = 0
//         this.refresher = null
//         // verbose
//         this.args = null
//         this.key = ""
//     }
// }

// simple cacher
export class AsyncCacher {
    // loader(key) => value
    //     optional async
    // ttl: time to live,  unit: millisecond.  no TTL if <= 0
    // options:  {limit, onCacheLoaded, useExpired}
    //   options.limit             no limit if <= 0
    //   options.useExpred         using expire ?
    //   options.refreshInterval   if present, will start a refresher for each live entry every specified interval
    //   options.refreshLimit      refresh times limit,no limit if <= 0
    //   options.onCacheLoaded(args,v)
    //   options.onCacheEvicted(args,v)
    //   optoins.shouldCacheNull   should we cache null? default false
    constructor(loader, ttl, onCacheLoaded, options) { // old signature: (loader,ttl,onCacheLoaded)
        if (typeof onCacheLoaded !== 'function' && !options) {
            options = onCacheLoaded
            onCacheLoaded = null
        }
        if (!onCacheLoaded) {
            onCacheLoaded = options?.onCacheLoaded
        }
        this.loader = loader
        this.ttl = ttl
        this.cache = {}
        this.onCacheLoaded = onCacheLoaded
        this._useExpired = !!options?.useExpired
        const limit = options?.limit
        if (limit > 0) {
            this._limit = limit
            this._keyFIFO = []
        }
        if (options?.refreshInterval > 0) {
            this._refreshInterval = options?.refreshInterval
            this._refreshLimit = 0
            if (options?.refreshLimit > 0) {
                this._refreshLimit = options?.refreshLimit
            }
        }
        this._onCacheEvicted = options?.onCacheEvicted
        this._onRefresherRun = options?.onRefresherRun
        this._shouldCacheNull = options?.shouldCacheNull === true
        this._size = 0
    }
    async get(args) {
        const key = this.getKey(args)
        let entry = this.cache[key]
        // console.log("before resolve,key, entry, this.cache:", key, entry, this.cache)
        if (!entry) {
            // console.log("get, initialize: key = ", key)
            // init
            this.cache[key] = entry = { args, key, status: StatusInitLoading }
            this._size++
            if (this._keyFIFO) {
                this._keyFIFO.push(key)
            }
            // console.log("before resolve,this.cache:", this.cache)
            entry.initResolver = this._loadOne(args).then(async v => {
                // initial load is nil, so we do not cache it
                if (!this._shouldCacheNull && (v === null || v === undefined)) {
                    this._deleteKey(key)
                    // return, but do not cache
                    return v
                }
                // console.log("get, initialize loaded: key = ", key)
                entry.status = StatusLoaded
                entry.value = v
                entry.time = Date.now()
                this._callOnCacheLoadedCallback(args, v)
                if (this._refreshInterval) {
                    let i = 0
                    const doRefresh = () => {
                        if (this._refreshLimit > 0 && i >= this._refreshLimit) {
                            entry.refresher = null // clear
                            return
                        }
                        if(this._onRefresherRun){
                            this._onRefresherRun(i)
                        }
                        this._loadOne(args).then(v => {
                            entry.time = Date.now()
                            entry.value = v
                            entry.refresher = setTimeout(doRefresh, this._refreshInterval)
                            this._callOnCacheLoadedCallback(args, v)
                        }).catch(e => {
                            console.error("error refreshing cache: args = ", args, ", key = ", key, e)
                        }).finally(() => {
                            i++
                        })
                    }
                    entry.refresher = setTimeout(doRefresh, this._refreshInterval)
                }
                this._checkEvict()
                // console.log("after loaded,this.cache:", this.cache)
                return v
            }).catch(e => {
                // on error, delete the entry
                console.error("init loading error:", e)
                this._deleteKey(key)
                throw e
            })
            return await entry.initResolver
        } else if (entry.status === StatusLoaded) {
            // console.log("get, status is StatusLoaded: key = ", key)
            // check if expired
            if (!(entry.time > 0) || (this.ttl > 0 && (entry.time - Date.now() > this.ttl))) {
                if (this._useExpired) {
                    entry.status = StatusExpireLoading
                } else {
                    entry.status = StatusInitLoading
                }
                // console.log("get, expired: key = ", key)
                // expired, return old value, but trigger load
                entry.initResolver = this._loadOne(args).then(async v => {
                    // later load is null, so do not cache it
                    if (!this._shouldCacheNull && (v === null || v === undefined)) {
                        this._deleteKey(key)
                        // return, but do not cache
                        return v
                    }
                    entry.value = v
                    entry.status = StatusLoaded
                    entry.time = Date.now()
                    this._callOnCacheLoadedCallback(args, v)
                    return v
                }).catch(e => {
                    console.error("expire loading error:", e)
                    entry.status = StatusLoaded // reset
                    throw e
                })
                if (!this._useExpired) {
                    return entry.initResolver
                }
            }
            return entry.value
        } else if (entry.status === StatusInitLoading) {
            // console.log("get, status is StatusInitLoading: key = ", key)
            return await entry.initResolver // will be resolved
        } else if (entry.status === StatusExpireLoading) {
            // console.log("get, status is StatusExpireLoading: key = ", key)
            return entry.value // return old value
        }
    }
    getKey(args) {
        return argsToKey(args)
    }
    async set(args, value) {
        // console.log("set:", key, value)
        const key = this.getKey(args)
        if (key in this.cache) {
            this.cache[key] = { status: StatusLoaded, value, time: Date.now() }
            if (this._keyFIFO) {
                const idx = this._keyFIFO.indexOf(key)
                if (idx >= 0) {
                    // treat like push
                    this._keyFIFO = [...this._keyFIFO.slice(0, idx), ...this._keyFIFO.slice(idx + 1), key]
                }
            }
        } else {
            this.cache[key] = { status: StatusLoaded, value, time: Date.now() }
            this._size++
            this._keyFIFO.push(key)
            this._checkEvict()
        }
    }

    invalidate(args) {
        // console.log("invalidate:", key)
        const key = this.getKey(args)
        this._deleteKey(key)
    }

    _deleteKey(key) {
        if (key in this.cache) {
            const entry = this.cache[key]
            delete this.cache[key]
            this._size--
            if (entry?.refresher) {
                clearTimeout(entry.refresher)
            }
            if (this._keyFIFO) {
                const idx = this._keyFIFO.indexOf(key)
                if (idx >= 0) {
                    this._keyFIFO = [...this._keyFIFO.slice(0, idx), ...this._keyFIFO.slice(idx + 1)]
                }
            }
        }
    }

    async _loadOne(args) {
        return await (async () => await this.loader(args))()
    }

    _checkEvict() {
        if (this._limit > 0 && this._size > this._limit) {
            // will evict old data
            const oldestKey = this._keyFIFO[0]
            this._keyFIFO = this._keyFIFO.slice(1)
            const entry = this.cache[oldestKey]
            delete this.cache[oldestKey]
            this._size--
            if (entry?.refresher) {
                clearTimeout(entry.refresher)
            }
            if (this._onCacheEvicted && entry) {
                this._onCacheEvicted(entry.args, entry.value)
            }
        }
    }
    async _callOnCacheLoadedCallback(args, v) {
        if (this.onCacheLoaded) {
            try {
                await this.onCacheLoaded(args, v)
            } catch (e) {
                console.error("on cache loaded callback error:", e)
            }
        }
    }

    /**
     * 
     * @public
     * @returns 
     */
    get size() {
        return this._size
    }
    /**
     * 
     * @public
     * @returns 
     */
    get keys() {
        return Object.keys(this.cache)
    }
    /**
     * stop all refreshers, if any
     * @public
     * @returns 
     */
    destroy() {
        for(let key in this.cache){
            const entry = this.cache[key]
            if(entry?.refresher){
                clearTimeout(entry.refresher)
            }
        }
    }
}