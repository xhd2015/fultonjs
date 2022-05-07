"use strict";

var code = _interopRequireWildcard(require("../code"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

async function test() {
  // testAnnotation()
  // testFormatCode()
  testFormatExpr();
}

async function testAnnotation() {
  const c = `{a:10,b:"30",c:false,d:{x:"en"}}`;
  const a = code.transferCode(c, {
    object: true,
    format: true,
    debug: true,
    annotation: {
      [ANNOTATION]: "// what is the fuck",
      a: {
        [ANNOTATION]: "// this is a"
      },
      b: {
        [ANNOTATION]: "// this is b"
      }
    }
  });
  console.log("transfered code:", a);
}

async function testFormatCode() {
  const c = `({a:10,b:"30" /*this is b*/,c:false,d:{x:"en"}})`;
  const a = code.formatCode(c);
  console.log("formated code:", a);
}

async function testFormatExpr() {
  const c = `{a:10,b:"30" /*this is b*/,c:false,d:{x:"en"}}`;
  const a = code.formatExpr(c);
  console.log("formated expr:", a);
}

test();