"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.keyValueRemap = keyValueRemap;
exports.keyValues = keyValues;
exports.map = map;
exports.mapToArray = mapToArray;
exports.methods = methods;
exports.randInt = randInt;
exports.randItem = randItem;
exports.range = range;
exports.remap = remap;
exports.remapValue = remapValue;
exports.valueRemap = valueRemap;
exports.values = values;

// depercated: use src
function randInt(low, high) {
  return Math.floor(Math.random() * (high - low)) + low;
}

function randItem(array) {
  return array[randInt(0, array.length)];
} // map to array


function map(obj, f) {
  return Object.keys(obj).map((key, index) => f(key, obj[key], index));
}

function mapToArray(obj, f) {
  return obj && Object.keys(obj).map((key, index) => f(key, obj[key], index));
}

function values(obj) {
  return map(obj, (_, v) => v);
}

function keyValues(obj) {
  return map(obj, (key, value) => ({
    key,
    value
  }));
} // remap to object


function remap(obj, f) {
  if (obj instanceof Array) {
    let keys = obj;
    let o = {};

    for (let key of keys) {
      o[key] = f(key);
    }

    return o;
  }
} // will regenerate key


function keyValueRemap(obj, f) {
  let o = {};

  for (let key in obj) {
    let [mapKey, mapValue] = f(key, obj[key]);
    o[mapKey] = mapValue;
  }

  return o;
} // valueRemap generates new value based on key & value


function valueRemap(obj, f) {
  let o = {};

  for (let key in obj) {
    o[key] = f(obj[key], key);
  }

  return o;
} // remap to object


function remapValue(obj, f) {
  let o = {};

  for (let key in obj) {
    o[key] = f(obj[key], key);
  }

  return o;
}

function range(n) {
  let array = Array(n).fill(0).map((_, i) => i);

  array.remap = f => remap(array, f);

  return array;
}

function methods(o, includePrivate) {
  let names = Object.getOwnPropertyNames(Object.getPrototypeOf(o));
  let methods = {};

  for (let name of names) {
    if (!includePrivate && name.startsWith("_")) {
      continue;
    }

    let prop = o[name];

    if (!prop) {
      continue;
    }

    if (prop instanceof Function) {
      methods[name] = prop;
    }
  }

  return methods;
}