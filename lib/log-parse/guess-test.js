"use strict";

var _guess = require("./guess");

var _parser = require("./parser");

var testUtils = _interopRequireWildcard(require("../test-util"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

function test() {
  testUtils.runTests({
    // testTryParseWithPrefix,
    // testTryParseWithPrefixLog1,
    // testTryExtractByStartingFromKV,
    testGuessReq
  });
}

function testTryParseWithPrefix() {
  var _a;

  return __awaiter(this, void 0, void 0, function* () {
    const s = yield testUtils.readFile(__dirname, "testdata/log2.txt");
    const obj = (0, _guess.tryExtractAllWithDetail)(s, {
      lookingPrefix: [{
        prefix: 'respBody: ',
        autoObjectBrace: true
      }]
    });
    const object = JSON.stringify((_a = obj === null || obj === void 0 ? void 0 : obj[0]) === null || _a === void 0 ? void 0 : _a.object);
    testUtils.expectEquals({
      object,
      expect: '{"infos":{"credit_user_id":1550333503592206300,"loan_id":"2021102180697961550333503592206336000101634825969412","confirm_time":1634825971}}'
    });
  });
}

function testTryParseWithPrefixLog1() {
  var _a;

  return __awaiter(this, void 0, void 0, function* () {
    const s = yield testUtils.readFile(__dirname, "testdata/log1.txt");
    const obj = (0, _guess.tryExtractAllWithDetail)(s, {
      lookingPrefix: [{
        prefix: 'Response: ',
        autoObjectBrace: true
      }]
    });
    const object = JSON.stringify((_a = obj === null || obj === void 0 ? void 0 : obj[0]) === null || _a === void 0 ? void 0 : _a.object);
    testUtils.expectEquals({
      object,
      expect: '{"infos":{"credit_user_id":1550333503592206300,"loan_id":"2021102180697961550333503592206336000101634825969412","confirm_time":1634825971}}'
    });
  });
}

function testTryExtractByStartingFromKV() {
  return __awaiter(this, void 0, void 0, function* () {
    const s = yield testUtils.readFile(__dirname, "testdata/log2.txt");
    (0, _guess.tryExtractByStartingFromKV)(s);
  });
}

function testGuessReq() {
  return __awaiter(this, void 0, void 0, function* () {
    const s = yield testUtils.readFile(__dirname, "testdata/req-0.txt");
    const objects = (0, _parser.guess)(s);
    console.log(objects);
  });
}

test();