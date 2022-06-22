"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadExcel = loadExcel;
exports.toExcel = toExcel;

var XLSX = _interopRequireWildcard(require("xlsx"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// requires  xlsx.full.min.js,
// see https://github.com/SheetJS/sheetjs
// npm install xlsx

/**
 * return an array of object read from excel
 */
function loadExcel(binContent) {
  var workbook = XLSX.read(binContent, {
    type: 'binary' // 'array' is also possible

  });
  let sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, {
    raw: true
  });
}
/**
 * save an array of object to excel
 * @param arrOfObject
 */


function toExcel(arrOfObject, file) {
  if (!arrOfObject) {
    return;
  }

  if (!Array.isArray(arrOfObject)) {
    throw new Error("not array");
  } // requires prototype


  arrOfObject.forEach(e => {
    if (!Object.getPrototypeOf(e)) {
      Object.setPrototypeOf(e, {});
    }
  });
  /* create a new blank workbook */

  var wb = XLSX.utils.book_new();
  let data = XLSX.utils.json_to_sheet(arrOfObject);
  /* Add the worksheet to the workbook */

  XLSX.utils.book_append_sheet(wb, data, "sheet");
  /* output format determined by filename */

  XLSX.writeFile(wb, file);
}