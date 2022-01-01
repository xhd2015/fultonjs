"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toCurlCommand = toCurlCommand;

var _string = require("./string");

var _qs = _interopRequireDefault(require("qs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// returns a string
// - options: {returnArray:false}
function toCurlCommand(config, options) {
  let {
    returnArray = false
  } = options || {};
  let cmds = ['curl']; // -x, --proxy [protocol://]host[:port] Use this proxy

  if (config.proxy) {
    let parts = [];

    if (config.proxy.protocol) {
      parts.push(config.proxy.protocol + "://");
    }

    parts.push(config.proxy.host || "err_proxy_host");

    if (config.proxy.port) {
      parts.push(":" + config.proxy.port);
    }

    cmds.push("--proxy", parts.join(""));
  } // method


  if (config.method) {
    cmds.push("-X", config.method.toUpperCase());
  }

  let url = new URL((0, _string.joinByOneSep)(config.baseURL || '', config.url || '', '/'));

  if (config.params) {
    if (typeof config.params === 'string') {
      url.search = config.params;
    } else {
      if (config.paramsSerializer) {
        url.search = config.paramsSerializer(config.params);
      } else {
        url.search = _qs.default.stringify(config.params, {
          arrayFormat: 'repeat'
        });
      }
    }
  } // url


  cmds.push(url.toString()); // headers

  for (let h in config.headers) {
    cmds.push("-H", h + ": " + config.headers[h]);
  }

  if (config.data) {
    if (typeof config.data === string) {
      cmds.push("--data-raw", config.data);
    } else {
      cmds.push("--data-raw", JSON.stringify(config.data));
    }
  }

  if (!returnArray) {
    return cmds.map(e => (0, _string.escapeShell)(e)).join(" ");
  }

  return cmds;
}