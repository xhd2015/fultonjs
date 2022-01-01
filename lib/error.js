"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InvalidArgumentsError = void 0;

class InvalidArgumentsError extends Error {
  constructor(msg) {
    super(msg);
  }

}

exports.InvalidArgumentsError = InvalidArgumentsError;