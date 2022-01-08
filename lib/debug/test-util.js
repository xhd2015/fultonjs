"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.expectEquals = expectEquals;
exports.runTests = runTests;

// const tests = { testShouldNotCacheNull }
async function runTests(tests) {
  return Promise.all(Object.keys(tests).map(f => tests[f]().then(() => {
    console.log(`[PASS] ${f}`);
  }).catch(e => {
    console.error(`[FAIL] ${f}`, e);
  })));
}

function expectEquals(obj) {
  const keys = Object.keys(obj);

  if (keys.length !== 2) {
    throw new Error("expectEquals exactly accepts two values");
  }

  if (obj[keys[0]] !== obj[keys[1]]) {
    throw new Error(`expect ${keys[0]} to be ${obj[keys[1]]}, actual: ${obj[keys[0]]}`);
  }
}