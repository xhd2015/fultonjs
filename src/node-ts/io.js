var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as fs from "fs/promises";
export function readStdin() {
    return __awaiter(this, void 0, void 0, function* () {
        return readAll(process.stdin);
    });
}
export function parseStdinJSON() {
    return __awaiter(this, void 0, void 0, function* () {
        return JSON.parse(yield readStdin());
    });
}
// if the file is treated as a config, it can be optional
export function parseFileJSONOptional(file) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return parseFileJSON(file);
        }
        catch (e) {
            return undefined;
        }
    });
}
export function parseFileJSON(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fs.readFile(file, { encoding: "utf-8" });
        return JSON.parse(data);
    });
}
export function readAll(readable) {
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
