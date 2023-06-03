export function dateTimeStrToUnixSeconds(s) {
    const d = moment(s, "YYYY-MM-DD HH:mm:ss");
    return d.toDate().getTime() / 1000;
}
export function dateTimeToUnixSeconds(s) {
    return Number((s.getTime() / 1000).toFixed());
}
// "YYYY-MM-DD HH:mm:ss"
const dateTimeFormat = `${moment.HTML5_FMT.DATE} ${moment.HTML5_FMT.TIME_SECONDS}`;
export function formatDateTime(d) {
    return moment(d).format(dateTimeFormat);
}
export function formatDate(d) {
    return moment(d).format(`${moment.HTML5_FMT.DATE}`);
}
export const HOUR_SEC = 60 * 60;
export const DAY_SEC = 24 * HOUR_SEC;
