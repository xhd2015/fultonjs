"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseFileJSON = parseFileJSON;
exports.parseFileJSONOptional = parseFileJSONOptional;
exports.parseStdinJSON = parseStdinJSON;
exports.readAll = readAll;
exports.readStdin = readStdin;

var fs = _interopRequireWildcard(require("fs/promises"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

function readStdin() {
  return __awaiter(this, void 0, void 0, function* () {
    return readAll(process.stdin);
  });
}

function parseStdinJSON() {
  return __awaiter(this, void 0, void 0, function* () {
    return JSON.parse(yield readStdin());
  });
} // if the file is treated as a config, it can be optional


function parseFileJSONOptional(file) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      return parseFileJSON(file);
    } catch (e) {
      return undefined;
    }
  });
}

function parseFileJSON(file) {
  return __awaiter(this, void 0, void 0, function* () {
    const data = yield fs.readFile(file, {
      encoding: "utf-8"
    });
    return JSON.parse(data);
  });
}

function readAll(readable) {
  return __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readable.on('data', e => {
        chunks.push(e);
      });
      readable.on('error', err => {
        reject(err);
      });
      readable.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf-8'));
      });
    });
  });
}