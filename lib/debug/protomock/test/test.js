"use strict";

var _proto = require("../proto");

var _mock = require("../mock");

var path = _interopRequireWildcard(require("path"));

var _annotationJson = require("../../annotation-json");

var _object = require("../../object");

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
  return __awaiter(this, void 0, void 0, function* () {
    const file = path.join(__dirname, "./test-enum.proto");
    const proto = yield (0, _proto.fromFileName)(file);
    const mocker = new _mock.Mocker({
      annotationKey: "$$comment"
    });
    (0, _proto.walkServices)(proto, (service, def, name) => {
      console.log("on service:", name);
      const methodsMock = mocker.mockRequestMethods(service);
      const method0 = Object.keys(methodsMock)[0];

      if (method0) {
        const res = methodsMock[method0]();
        console.log("mock method0:", method0, res.plain, res.annotation);
        const merged = (0, _object.deepmerge)(res.annotation, {
          "$$comment": "in the root",
          arr_test: [{
            "$$comment": "replaced"
          }, {
            "$$comment": "not existed"
          }],
          map_test: {
            "0": {
              "$$comment": "map replaced"
            }
          }
        });
        console.log("merged:", merged);
        const mockStr = (0, _annotationJson.stringify)(res.plain, {
          annotation: merged,
          annotationKey: "$$comment",
          pretty: true
        });
        console.log("mock str:", mockStr);
      }
    });
  });
}

function testSmoke() {
  return __awaiter(this, void 0, void 0, function* () {
    const file = "/Users/xiaohuadong/Projects/gopath/src/git.garena.com/shopee/loan-service/credit_backend/public/protobuf/protobuf3/credit_pay_v2.proto";
    const proto = yield (0, _proto.fromFileName)(file); // console.log("proto:", proto)

    (0, _proto.walkServices)(proto, (service, def, name) => {
      console.log("on service:", name);
      const mocker = new _mock.Mocker({
        mockScalar: type => (0, _mock.mockScalarMore)(type, "")
      });
      const methodsMock = mocker.mockRequestMethods(service);
      const method0 = Object.keys(methodsMock)[0];

      if (method0) {
        console.log("mock method0:", method0, methodsMock[method0]().plain);
      }
    });
  });
}

test();