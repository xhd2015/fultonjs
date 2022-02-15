"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeDebug = makeDebug;

function makeDebug(debug) {
  return function (...args) {
    {
      if (!debug) {
        return;
      }

      console.log("DEBUG ", ...args);
    }
  };
}