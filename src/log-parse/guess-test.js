var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { tryExtractByStartingFromKV, tryExtractAllWithDetail } from "./guess";
import { guess } from "./parser";
import * as testUtils from "../test-util";
function test() {
    testUtils.runTests({
        // testTryParseWithPrefix,
        // testTryParseWithPrefixLog1,
        // testTryExtractByStartingFromKV,
        testGuessReq,
    });
}
function testTryParseWithPrefix() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const s = yield testUtils.readFile(__dirname, "testdata/log2.txt");
        const obj = tryExtractAllWithDetail(s, {
            lookingPrefix: [{ prefix: 'respBody: ', autoObjectBrace: true }]
        });
        const object = JSON.stringify((_a = obj === null || obj === void 0 ? void 0 : obj[0]) === null || _a === void 0 ? void 0 : _a.object);
        testUtils.expectEquals({ object, expect: '{"infos":{"credit_user_id":1550333503592206300,"loan_id":"2021102180697961550333503592206336000101634825969412","confirm_time":1634825971}}' });
    });
}
function testTryParseWithPrefixLog1() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const s = yield testUtils.readFile(__dirname, "testdata/log1.txt");
        const obj = tryExtractAllWithDetail(s, {
            lookingPrefix: [{ prefix: 'Response: ', autoObjectBrace: true }]
        });
        const object = JSON.stringify((_a = obj === null || obj === void 0 ? void 0 : obj[0]) === null || _a === void 0 ? void 0 : _a.object);
        testUtils.expectEquals({ object, expect: '{"infos":{"credit_user_id":1550333503592206300,"loan_id":"2021102180697961550333503592206336000101634825969412","confirm_time":1634825971}}' });
    });
}
function testTryExtractByStartingFromKV() {
    return __awaiter(this, void 0, void 0, function* () {
        const s = yield testUtils.readFile(__dirname, "testdata/log2.txt");
        tryExtractByStartingFromKV(s);
    });
}
function testGuessReq() {
    return __awaiter(this, void 0, void 0, function* () {
        const s = yield testUtils.readFile(__dirname, "testdata/req-0.txt");
        const objects = guess(s);
        console.log(objects);
    });
}
test();
