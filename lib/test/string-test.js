"use strict";

var _stringSimilarity = require("../string-similarity");

function testIndexedSum() {
  let strings = ["aaabbccccdssdf", "aabbeassdsf", "adsfew"];
  let sums = strings.map(e => (0, _stringSimilarity.indexedSum)(e));
  console.log(sums);
}

testIndexedSum();