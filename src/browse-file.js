var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const CONTENT_EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const CONTENT_JSON = "application/json";
/**
 *  if no file chosen, null is set to callback argument
 *  accept option example: .json, .xls, .xlsx
 * @param callback
 * @param option {binary=false,accept}
 *
 */
export function chooseFileToRead(option) {
    return __awaiter(this, void 0, void 0, function* () {
        const binary = option === null || option === void 0 ? void 0 : option.binary;
        const file = document.createElement('input');
        file.type = 'file';
        file.accept = option ? option.accept : null; // 'image/png, image/jpeg'
        return new Promise((resolve, reject) => {
            file.addEventListener('change', function (e) {
                if (file.files.length === 0) {
                    resolve(undefined);
                    return;
                }
                let reader = new FileReader();
                reader.onload = function (e) {
                    resolve({ file: file.files[0], content: reader.result });
                    return;
                };
                if (binary) {
                    reader.readAsBinaryString(file.files[0]);
                }
                else {
                    reader.readAsText(file.files[0]);
                }
            });
            file.click();
        });
    });
}
export function saveContentToFile(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {
        type: contentType
    });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}
