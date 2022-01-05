"use strict";

var _cache = require("./cache");

async function sleep(n) {
  return new Promise(resolve => setTimeout(resolve, n));
}

async function test() {
  const cacher = new _cache.AsyncCacher(async args => {
    const n = Math.floor(Math.random() * 500);
    console.log(`cache loading, will sleep ${n} ms,args:${JSON.stringify(args)}`);
    await sleep(n);
    return n;
  }, 0, {
    onCacheLoaded(args, v) {
      console.log("cache loaded:", args, v);
    },

    onCacheEvicted(args, v) {
      console.log("cache evicted:", args, v);
    },

    refreshInterval: 2000,
    refreshLimit: 5,
    limit: 2
  });
  const v1 = await cacher.get({
    t: 1
  });
  console.log("v1:", v1);
  const v2 = await cacher.get({
    t: 2
  });
  console.log("v2:", v2);
  console.log("sleep for 10s");
  await sleep(10 * 1000);
  const v3 = await cacher.get({
    t: 3
  });
  console.log("v3:", v3);
}

test();