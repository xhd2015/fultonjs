"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InvalidArgumentsError = void 0;
exports.isEmpty = isEmpty;
exports.isEmptyInvalid = isEmptyInvalid;
exports.validate = validate;
exports.validateArrayNotEmpty = validateArrayNotEmpty;
exports.validateObjectAtLeastOneKey = validateObjectAtLeastOneKey;

class InvalidArgumentsError extends Error {
  constructor(msg) {
    super(msg);
  }

}

exports.InvalidArgumentsError = InvalidArgumentsError;

function isEmpty(e) {
  return e == null || e === '';
}

function isEmptyInvalid(e) {
  return isEmpty(e) || typeof e === 'number' && isNaN(e);
} // options = {key:{arrayNotEmpty:true|false}}
// options.$ignore: [keys]


function validate(obj, options) {
  let ignore = options && options["$ignore"];

  for (let key in obj) {
    if (ignore && ignore.includes(key)) {
      continue;
    } // NaN is invalid also


    if (isEmptyInvalid(obj[key])) {
      throw new InvalidArgumentsError("requires " + key);
    }

    if (options && options[key] && options.arrayNotEmpty) {
      if (!Array.isArray(obj[key]) || obj[key].length === 0) {
        throw new InvalidArgumentsError("requires " + key + " not empty array");
      }
    }
  }
}

function validateArrayNotEmpty(obj) {
  for (let key in obj) {
    const value = obj[key];

    if (!value) {
      throw new InvalidArgumentsError("requires " + key);
    }

    if (!Array.isArray(value)) {
      throw new InvalidArgumentsError("requires " + key + " to be array,found:" + value);
    }

    if (value.length === 0) {
      throw new InvalidArgumentsError("requires " + key + " not empty");
    }
  }
}

function validateObjectAtLeastOneKey(obj) {
  for (let key in obj) {
    const value = obj[key];

    if (!value) {
      throw new InvalidArgumentsError("requires " + key);
    }

    if (typeof value !== 'object') {
      throw new InvalidArgumentsError("requires " + key + " to be object,found:" + value);
    }

    if (Array.isArray(value)) {
      throw new InvalidArgumentsError("requires " + key + " to be object,found array:" + value);
    }

    if (Object.keys(value).length === 0) {
      throw new InvalidArgumentsError("requires " + key + " not empty");
    }
  }
}