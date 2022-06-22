
// requires  xlsx.full.min.js,
// see https://github.com/SheetJS/sheetjs
// npm install xlsx

import * as XLSX from "xlsx"


/**
 * return an array of object read from excel
 */
export function loadExcel(binContent) {
    var workbook = XLSX.read(binContent, {
        type: 'binary' // 'array' is also possible
    });
    let sheet = workbook.Sheets[workbook.SheetNames[0]]
    return XLSX.utils.sheet_to_json(sheet, { raw: true })
}

/**
 * save an array of object to excel
 * @param arrOfObject
 */
export function toExcel(arrOfObject: any[], file: string) {
    if (!arrOfObject) {
        return
    }
    if (!Array.isArray(arrOfObject)) {
        throw new Error("not array")
    }
    // requires prototype
    arrOfObject.forEach(e => {
        if (!Object.getPrototypeOf(e)) {
            Object.setPrototypeOf(e, {})
        }
    })
    /* create a new blank workbook */
    var wb = XLSX.utils.book_new();
    let data = XLSX.utils.json_to_sheet(arrOfObject)
    /* Add the worksheet to the workbook */
    XLSX.utils.book_append_sheet(wb, data, "sheet");
    /* output format determined by filename */
    XLSX.writeFile(wb, file);
}
