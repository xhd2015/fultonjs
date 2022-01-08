"use strict";

var _code = require("../code");

async function test() {
  testAnnotation();
}

async function testAnnotation() {
  const code = `{a:10,b:"30",c:false,d:{x:"en"}}`;
  const a = (0, _code.transferCode)(code, {
    object: true,
    format: true,
    debug: true,
    annotation: {
      [_code.ANNOTATION]: "// what is the fuck",
      a: {
        [_code.ANNOTATION]: "// this is a"
      },
      b: {
        [_code.ANNOTATION]: "// this is b"
      }
    }
  });
  console.log("transfered code:", a);
}

test();