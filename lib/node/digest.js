"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.md5 = void 0;
const crypto_1 = require("crypto");
function md5(s) {
    if (!s) {
        return '';
    }
    return (0, crypto_1.createHash)('md5').update(s).digest('hex');
}
exports.md5 = md5;
