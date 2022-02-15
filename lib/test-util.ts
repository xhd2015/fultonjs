const fs = require("fs");
const path = require("path")
// const tests = { testShouldNotCacheNull }
export async function runTests(tests) {
    return Promise.all(Object.keys(tests).map(f => Promise.resolve(tests[f]()).then(() => {
        console.log(`[PASS] ${f}`)
    }).catch(e => {
        console.error(`[FAIL] ${f}`, e)
    })))
}

export function expectEquals(obj) {
    const keys = Object.keys(obj)
    if (keys.length !== 2) {
        throw new Error("expectEquals exactly accepts two values")
    }
    if (obj[keys[0]] !== obj[keys[1]]) {
        throw new Error(`expect ${keys[0]} to be ${obj[keys[1]]}, actual: ${obj[keys[0]]}`)
    }
}
export async function readFile(dirname, file) {
    return await fs.promises.readFile(path.resolve(dirname, file), { encoding: 'utf-8' })
}

export function readFileSync(dirname, file) {
    return fs.readFileSync(path.resolve(dirname, file), { encoding: 'utf-8' })
}