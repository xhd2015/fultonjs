"use strict";

var _pool = require("../pool");

var _promise = require("../promise");

async function test() {
  const pool = new _pool.Pool(3, 200);

  const makeFn = i => {
    return async () => {
      const n = Math.floor(Math.random() * 2000) + 1000; // 1000~3000

      console.log(`task ${i} will sleep ${n} ms`);
      await (0, _promise.wait)(n);
      console.log(`task ${i} done`);
    };
  };

  const fns = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => makeFn(i));
  const actions = fns.map(fn => pool.withinPool(fn));
  await Promise.all(actions);
  console.log("all actions end");
  pool.close();
}

test();