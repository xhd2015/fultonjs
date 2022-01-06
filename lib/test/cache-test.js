"use strict";

var _cache = require("../cache");

var _promise = require("../promise");

function test() {
  const tests = {
    testShouldNotCacheNull
  };
  Promise.all(Object.keys(tests).map(f => tests[f]().then(() => {
    console.log(`[PASS] ${f}`);
  }).catch(e => {
    console.error(`[FAIL] ${f}`, e);
  })));
}

async function testSmoke() {
  const cacher = new _cache.AsyncCacher(async args => {
    const n = Math.floor(Math.random() * 500);
    console.log(`cache loading, will sleep ${n} ms,args:${JSON.stringify(args)}`);
    await (0, _promise.wait)(n);
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
  await (0, _promise.wait)(10 * 1000);
  const v3 = await cacher.get({
    t: 3
  });
  console.log("v3:", v3);
}

async function testShouldNotCacheNull() {
  let i = 0;
  const cacher = new _cache.AsyncCacher(async args => {
    if (i === 0) {
      i++;
      return null;
    }

    return 1;
  });
  const v0 = await cacher.get("none");

  if (v0 !== null) {
    throw new Error(`expect v0 to be null,actual ${v0}`);
  }

  if (cacher.size !== 0) {
    throw new Error(`expect cacher.size to be 0, actual:${cacher.size}`);
  }

  const v1 = await cacher.get("none");

  if (v1 !== 1) {
    throw new Error(`expect v1 to be 1,actual ${v1}`);
  }

  if (cacher.size !== 1) {
    throw new Error(`expect cacher.size to be 1, actual:${cacher.size}`);
  }

  const keys = cacher.keys;
  console.log("keys:", keys);
}

test();