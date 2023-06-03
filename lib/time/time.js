"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAY_SEC = exports.HOUR_SEC = exports.formatDate = exports.formatDateTime = exports.dateTimeToUnixSeconds = exports.dateTimeStrToUnixSeconds = void 0;
const moment = require("moment");
function dateTimeStrToUnixSeconds(s) {
    const d = moment(s, "YYYY-MM-DD HH:mm:ss");
    return d.toDate().getTime() / 1000;
}
exports.dateTimeStrToUnixSeconds = dateTimeStrToUnixSeconds;
function dateTimeToUnixSeconds(s) {
    return Number((s.getTime() / 1000).toFixed());
}
exports.dateTimeToUnixSeconds = dateTimeToUnixSeconds;
// "YYYY-MM-DD HH:mm:ss"
const dateTimeFormat = `${moment.HTML5_FMT.DATE} ${moment.HTML5_FMT.TIME_SECONDS}`;
function formatDateTime(d) {
    return moment(d).format(dateTimeFormat);
}
exports.formatDateTime = formatDateTime;
function formatDate(d) {
    return moment(d).format(`${moment.HTML5_FMT.DATE}`);
}
exports.formatDate = formatDate;
exports.HOUR_SEC = 60 * 60;
exports.DAY_SEC = 24 * exports.HOUR_SEC;
