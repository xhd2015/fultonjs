"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AsyncCacher = void 0;
const StatusInitLoading = 1;
const StatusExpireLoading = 2;
const StatusLoaded = 3; // simple cacher

class AsyncCacher {
  // loader(key) => value
  //     optional async
  // ttl: time to live,  unit: millisecond
  constructor(loader, ttl, onCacheLoaded) {
    this.loader = loader;
    this.ttl = ttl;
    this.cache = {};
    this.onCacheLoaded = onCacheLoaded;
  }

  async get(key) {
    let entry = this.cache[key]; // console.log("before resolve,key, entry, this.cache:", key, entry, this.cache)

    if (!entry) {
      // console.log("get, initialize: key = ", key)
      // init
      this.cache[key] = entry = {
        status: StatusInitLoading
      }; // console.log("before resolve,this.cache:", this.cache)

      entry.initResolver = this._loadOne(key).then(async v => {
        // console.log("get, initialize loaded: key = ", key)
        entry.status = StatusLoaded;
        entry.value = v;
        entry.time = Date.now();

        if (this.onCacheLoaded) {
          try {
            await this.onCacheLoaded(key, v);
          } catch (e) {
            console.error("on cache loaded callback error:", e);
          }
        } // console.log("after loaded,this.cache:", this.cache)


        return v;
      }).catch(e => {
        // on error, delete the entry
        console.error("init loading error:", e);
        delete this.cache[key];
        throw e;
      });
      return await entry.initResolver;
    } else if (entry.status === StatusLoaded) {
      // console.log("get, status is StatusLoaded: key = ", key)
      if (!(entry.time > 0) || this.ttl > 0 && entry.time - Date.now() > this.ttl) {
        // console.log("get, expired: key = ", key)
        // expired, return old value, but trigger load
        entry.status = StatusExpireLoading;

        this._loadOne(key).then(async v => {
          entry.value = v;
          entry.status = StatusLoaded;
          entry.time = Date.now();

          if (this.onCacheLoaded) {
            try {
              await this.onCacheLoaded(key, v);
            } catch (e) {
              console.error("on cache loaded callback error:", e);
            }
          }

          return v;
        }).catch(e => {
          console.error("expire loading error:", e);
          entry.status = StatusLoaded;
          throw e;
        });
      }

      return entry.value;
    } else if (entry.status === StatusInitLoading) {
      // console.log("get, status is StatusInitLoading: key = ", key)
      return await entry.initResolver;
    } else if (entry.status === StatusExpireLoading) {
      // console.log("get, status is StatusExpireLoading: key = ", key)
      return entry.value; // return old value
    }
  }

  async set(key, value) {
    // console.log("set:", key, value)
    this.cache[key] = {
      status: StatusLoaded,
      value,
      time: Date.now()
    };
  }

  async invalidate(key) {
    // console.log("invalidate:", key)
    delete this.cache[key];
  }

  async _loadOne(key) {
    return await (async () => await this.loader(key))();
  }

}

exports.AsyncCacher = AsyncCacher;