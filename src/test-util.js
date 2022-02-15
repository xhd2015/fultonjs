var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const fs = require("fs");
const path = require("path");
// const tests = { testShouldNotCacheNull }
export function runTests(tests) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.all(Object.keys(tests).map(f => Promise.resolve(tests[f]()).then(() => {
            console.log(`[PASS] ${f}`);
        }).catch(e => {
            console.error(`[FAIL] ${f}`, e);
        })));
    });
}
export function expectEquals(obj) {
    const keys = Object.keys(obj);
    if (keys.length !== 2) {
        throw new Error("expectEquals exactly accepts two values");
    }
    if (obj[keys[0]] !== obj[keys[1]]) {
        throw new Error(`expect ${keys[0]} to be ${obj[keys[1]]}, actual: ${obj[keys[0]]}`);
    }
}
export function readFile(dirname, file) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fs.promises.readFile(path.resolve(dirname, file), { encoding: 'utf-8' });
    });
}
export function readFileSync(dirname, file) {
    return fs.readFileSync(path.resolve(dirname, file), { encoding: 'utf-8' });
}
