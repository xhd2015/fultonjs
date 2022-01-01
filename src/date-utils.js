function padding(s) {
    s = String(s)
    if (s.length === 0) {
        return "00"
    } else if (s.length === 1) {
        return "0" + s
    }
    return s
}

function formatServerDateStrToYYYYMMDD(dateStr) {
    // new Date(null) = begin
    return jsDateToYYYYMMDD(new Date(dateStr))
}
function formatServerDateStrToYYYYMMDD_HHMMSS(dateStr) {
    // new Date(null) = begin
    return jsDateToYYYYMMDD_HHMMSS(new Date(dateStr))
}
function jsDateToYYYYMMDD(date) {
    if (date == null) {
        date = new Date()
    }
    let p = padding
    // 2020-06-05
    return date.getFullYear() + "-" + p(date.getMonth() + 1) + "-" + p(date.getDate())
}
function jsDateToYYYYMMDD_HHMMSS(date) {
    if (date == null) {
        date = new Date()
    }
    let p = padding
    // 2020-06-05 06:08:09
    return jsDateToYYYYMMDD(date) + " " +
        p(date.getHours()) + ":" + p(date.getMinutes()) + ":" + p(date.getSeconds())
}
function jsDateToYYYYMMDDHHMMSS_NoSep(date) {
    if (date == null) {
        date = new Date()
    }
    let p = padding
    // 20200605060809
    return date.getFullYear() + p(date.getMonth() + 1) + p(date.getDate()) + p(date.getHours()) + p(date.getMinutes()) + p(date.getSeconds())
}
function getDateEnd(dateStr) {
    return new Date(dateStr + " 23:59:59")
}
function getDateBegin(dateStr) {
    return new Date(dateStr + " 00:00:00")
}
function jsDateToSeconds(date) {
    return Number((date.getTime() / 1000).toFixed())
}

// new APIs
export function getTime(date) {
    return typeof date === 'number' && !isNaN(date) ? date : toDate(date).getTime()
}
export function toDate(date) {
    if (date === undefined) return new Date()
    if (date instanceof Date) return date
    return new Date(date)
}
export function toNewDate(date) {
    if (date === undefined) return new Date()
    return new Date(date)
}
export function toYYYYmmdd(date) {
    return jsDateToYYYYMMDD(toDate(date))
}
export function toYYYYmmdd_HHMMSS(date) {
    return jsDateToYYYYMMDD_HHMMSS(toDate(date))
}
export function toYYYYmmddHHMMSS_NoSep(date) {
    return jsDateToYYYYMMDDHHMMSS_NoSep(toDate(date))
}
export function toDateEnd(date) {
    let newDate = toNewDate(date)
    newDate.setHours(23)
    newDate.setMinutes(59)
    newDate.setSeconds(59)
    newDate.setMilliseconds(0)
    return newDate
}
export function toDateBegin(date) {
    let newDate = toNewDate(date)
    newDate.setHours(0)
    newDate.setMinutes(0)
    newDate.setSeconds(0)
    newDate.setMilliseconds(0)
    return newDate
}
export function addDay(date, day) {
    let newDate = toNewDate(date)
    newDate.setDate(newDate.getDate() + day)
    return newDate
}
export function addHour(date, hour) {
    let newDate = toNewDate(date)
    newDate.setHours(newDate.getHours() + hour)
    return newDate
}
export function toSeconds(date) {
    return Number((toDate(date).getTime() / 1000).toFixed())
}

export const SECOND = 1000 // millisecond of a second
export const MINUTE = 60 * SECOND // millisecond of a minute
export const HOUR = 60 * MINUTE // millisecond of an hour
export const DAY = 24 * HOUR // millisecond of a day