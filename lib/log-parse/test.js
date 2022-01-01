#!/usr/bin/env node
"use strict";

const fs = require("fs");

const path = require("path");

const {
  parseNext,
  tryParseAll
} = require("./index");

function test() {
  testString();
  testStringUtf8();
  testStringEscape();
  testNumber();
  testObject();
  testObjectMoreFields();
  testArray();
  testArrayNested();
  testTryParseAll();
}

function testNumber() {
  const {
    type,
    value,
    next
  } = parseNext('123456', 6, 0);

  if (type !== 'number') {
    throw `expect type number,actual:${type}`;
  }

  if (value !== 123456) {
    throw `expect value 123456,actual:${value}`;
  }

  if (next !== 6) {
    throw `expect next 6,actual:${next}`;
  }

  console.log("[PASS] testNumber");
}

function testString() {
  const {
    type,
    value,
    next
  } = parseNext('"abcd"', 6, 0);

  if (type !== 'string') {
    throw `expect type string,actual:${type}`;
  }

  if (value !== 'abcd') {
    throw `expect value 'abcd',actual:${value}`;
  }

  if (next !== 6) {
    throw `expect next 6,actual:${next}`;
  }

  console.log("[PASS] testString");
}

function testStringUtf8() {
  const s = '"R M\\303\\251xico"';
  const {
    type,
    value,
    next
  } = parseNext(s, s.length, 0);

  if (type !== 'string') {
    throw `expect type string,actual:${type}`;
  }

  if (value !== 'R México') {
    throw `expect value 'R México',actual:${value}`;
  }

  if (next !== s.length) {
    throw `expect next ${s.length},actual:${next}`;
  }

  console.log("[PASS] testStringUtf8");
}

function testStringEscape() {
  const s = '"aa\\tbb\\ncc\\"\\""';
  const {
    type,
    value,
    next
  } = parseNext(s, s.length, 0);

  if (type !== 'string') {
    throw `expect type string,actual:${type}`;
  }

  const expectStr = "aa\tbb\ncc\"\"";

  if (value !== expectStr) {
    throw `expect value /${expectStr}/,actual:${value}`;
  }

  if (next !== s.length) {
    throw `expect next ${s.length},actual:${next}`;
  }

  console.log("[PASS] testStringEscape");
}

function testObject() {
  const {
    type,
    value,
    next
  } = parseNext('{abcd:123456}', 13, 0);

  if (type !== 'object') {
    throw `expect type object,actual:${type}`;
  }

  if (value.abcd !== 123456) {
    throw `expect value .abcd==123456,actual:${value.abcd}`;
  }

  if (next !== 13) {
    throw `expect next 13,actual:${next}`;
  }

  console.log("[PASS] testObject");
}

function testObjectMoreFields() {
  const s = '{user_id:1008104126 platform_user_id:"1201190823" platform_type:1 channel_id:1 total_price:500 receiver_name:"Spongebob" receiver_address:"rgg" receiver_phone:"5561999816188" checkout_id:"6701958780851231957" total_amount:1000 seller_name:"nikilathuser3" seller_address:"xgg" seller_phone:"5595559923200"}';
  const {
    type,
    value,
    next
  } = parseNext(s, s.length, 0);

  if (type !== 'object') {
    throw `expect type object,actual:${type}`;
  }

  const valueStr = JSON.stringify(value);
  const expectStr = '{"user_id":1008104126,"platform_user_id":"1201190823","platform_type":1,"channel_id":1,"total_price":500,"receiver_name":"Spongebob","receiver_address":"rgg","receiver_phone":"5561999816188","checkout_id":"6701958780851231957","total_amount":1000,"seller_name":"nikilathuser3","seller_address":"xgg","seller_phone":"5595559923200"}';

  if (valueStr !== expectStr) {
    throw `expect value ${expectStr},actual:${valueStr}`;
  }

  if (next !== s.length) {
    throw `expect next ${s.length},actual:${next}`;
  }

  console.log("[PASS] testObjectMoreFields");
}

function testArray() {
  const s = `<ref_id:"ppdmlf7Zd4" total_amount:1000 seller_name:"nikilathuser3" seller_phone:"5595559923200">`;
  const {
    type,
    value,
    next
  } = parseNext(s, s.length, 0);

  if (type !== 'array') {
    throw `expect type object,actual:${type}`;
  }

  const valueStr = JSON.stringify(value);
  const expectStr = '[{"ref_id":"ppdmlf7Zd4","total_amount":1000,"seller_name":"nikilathuser3","seller_phone":"5595559923200"}]';

  if (valueStr !== expectStr) {
    throw `expect value ${expectStr},actual:${valueStr}`;
  }

  if (next !== s.length) {
    throw `expect next ${s.length},actual:${next}`;
  }

  console.log("[PASS] testArray");
}

function testArrayNested() {
  const s = `<ref_id:"ppdmlf7Zd4" total_amount:1000 seller_name:"nikilathuser3" seller_phone:"5595559923200" item_infos:<sku_id:"111" details:"{}" > >`;
  const {
    type,
    value,
    next
  } = parseNext(s, s.length, 0);

  if (type !== 'array') {
    throw `expect type object,actual:${type}`;
  }

  const valueStr = JSON.stringify(value);
  const expectStr = '[{"ref_id":"ppdmlf7Zd4","total_amount":1000,"seller_name":"nikilathuser3","seller_phone":"5595559923200","item_infos":[{"sku_id":"111","details":"{}"}]}]';

  if (valueStr !== expectStr) {
    throw `expect value ${expectStr},actual:${valueStr}`;
  }

  if (next !== s.length) {
    throw `expect next ${s.length},actual:${next}`;
  }

  console.log("[PASS] testArrayNested");
}

function testTryParseAll() {
  const s = fs.readFileSync(path.resolve(__dirname, "testdata-try.txt"), {
    encoding: 'utf-8'
  });
  const objs = tryParseAll(s);

  if (objs.length !== 1) {
    throw `expect objects length:1`;
  }

  const keys = Object.keys(objs[0]);
  const keysStr = JSON.stringify(keys);
  const expectStr = '["user_id","platform_user_id","platform_type","channel_id","total_price","receiver_name","receiver_address","receiver_phone","checkout_id","order_infos","term_num"]';

  if (keysStr !== expectStr) {
    throw `expect keys ${expectStr},actual:${keysStr}`;
  } // inspect nested fields


  const itemInfo = objs[0].order_infos?.[0]?.item_infos?.[0];
  const {
    sku_id,
    sku_name,
    total_price,
    model_id,
    item_id
  } = itemInfo || {};
  const trimItemInfo = {
    sku_id,
    sku_name,
    total_price,
    model_id,
    item_id
  };
  const itemInfosStr = JSON.stringify(trimItemInfo);
  const expectItemInfosStr = '{"sku_id":"3000128884","sku_name":"installment_test","total_price":1000,"model_id":"2000263298","item_id":"3000128884"}';

  if (itemInfosStr !== expectItemInfosStr) {
    throw `expect items ${expectItemInfosStr},actual:${itemInfosStr}`;
  }

  console.log("[PASS] testTryParseAll");
}

test();