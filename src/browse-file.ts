export const CONTENT_EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
export const CONTENT_JSON = "application/json"

export interface ReadFileOptions {
    binary?: boolean
    accept?: string //   'image/png, image/jpeg'
}

export interface FileResult {
    content: string | ArrayBuffer
    file: File
}
/**
 *  if no file chosen, null is set to callback argument
 *  accept option example: .json, .xls, .xlsx
 * @param callback
 * @param option {binary=false,accept}
 *
 */
export async function chooseFileToRead(option?: ReadFileOptions): Promise<FileResult> {
    const binary = option?.binary
    const file = document.createElement('input')
    file.type = 'file'
    file.accept = option ? option.accept : null // 'image/png, image/jpeg'
    return new Promise((resolve, reject) => {
        file.addEventListener('change', function (e) {
            if (file.files.length === 0) {
                resolve(undefined)
                return
            }
            let reader = new FileReader()
            reader.onload = function (e) {
                resolve({ file: file.files[0], content: reader.result })
                return
            }
            if (binary) {
                reader.readAsBinaryString(file.files[0])
            } else {
                reader.readAsText(file.files[0])
            }
        })
        file.click()
    })
}

export function saveContentToFile(content: string, fileName: string, contentType: string) {
    var a = document.createElement("a");
    var file = new Blob([content], {
        type: contentType
    });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

