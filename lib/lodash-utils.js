"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.debounce = debounce;

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//   debounce(this.updateParsedLog,200)(this.log)
const debounceMem = {};

function debounce(fn, n) {
  const memFn = debounceMem[fn];

  if (memFn) {
    return memFn;
  }

  return debounceMem[fn] = _lodash.default.debounce(fn, n);
}