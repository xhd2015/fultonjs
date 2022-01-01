"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.request = request;
exports.serializeParamRepeat = serializeParamRepeat;

var _axios = _interopRequireDefault(require("axios"));

var _qs = _interopRequireDefault(require("qs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// use a=1&a=2, rather than a[]=1&a[]=2
function serializeParamRepeat(params) {
  return _qs.default.stringify(params, {
    arrayFormat: "repeat"
  });
} // config:{useProxy, repeatUseArray, baseURL, url, method, params, headers,data, timeout....}
// proxy: (config)


async function request(config, proxy) {
  if (config.useProxy) {
    return await proxy(config);
  } else {
    if (!this.repeatUseArray) {
      config.paramsSerializer = serializeParamRepeat;
    }

    return await _axios.default.request(config);
  }
}