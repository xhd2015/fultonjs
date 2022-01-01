

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
function toDate(date){
    if(date === undefined)return new Date()
    if(date instanceof Date)return date
    return new Date(date)
}
function toNewDate(date){
    if(date===undefined)return new Date()
    return new Date(date)
}

function toYYYYmmdd(date){
    return jsDateToYYYYMMDD(toDate(date))
}
function toYYYYmmdd_HHMMSS(date){
    return jsDateToYYYYMMDD_HHMMSS(toDate(date))
}
function toDateEnd(date){
    let newDate = toNewDate(date) 
    newDate.setHours(23)
    newDate.setMinutes(59)
    newDate.setSeconds(59)
    newDate.setMilliseconds(0)
    return newDate
}
function toDateBegin(date){
    let newDate = toNewDate(date) 
    newDate.setHours(0)
    newDate.setMinutes(0)
    newDate.setSeconds(0)
    newDate.setMilliseconds(0)
    return newDate
}
function addDay(date,day){
    let newDate = toNewDate(date) 
    newDate.setDate(newDate.getDate() + day)
    return newDate
}
function addHour(date,hour){
    let newDate = toNewDate(date) 
    newDate.setHours(newDate.getHours() + hour)
    return newDate
}
function toSeconds(date){
    return Number((toDate(date).getTime() / 1000).toFixed())
}

module.exports =  {
    toYYYYmmdd,
    toYYYYmmdd_HHMMSS,
    toDateEnd,
    toDateBegin,
    toSeconds,
    addDay,
    addHour,
}