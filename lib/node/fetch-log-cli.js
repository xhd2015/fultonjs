#!/usr/bin/env node
help = `
Usage:fetch-log-cli [OPTIONS] PSM...

fetch log for PSM list

Options:
    -h, --help           show help message
        --start START    start time
        --end   END      end time
        --today          today's log(default)     
        --last-7-days    last 7 day's log
        --limit LIMIT    limit, default: 10000, should be less than 10000
        --prefix PREFIX  the log name prefix
    -f, --file FILE      output file name

Example:
  $ fetch-log-cli --today project.service.api 
  $ fetch-log-cli --last-7-days --prefix all.html project.service.api project.service.interact project.service.info project.service.present \\
            project.service.invite project.service.open project.service.pet project.service.bcp project.service.gift_consumer \\
            project.service_other.base project.service_other.wallet project.service_other.consumer project.service_other.api project.service_other.info \\
            project.service_other.box project.service_other.settle_consumer project.service_other.player_consumer project.service_other.room_consumer \\
            project.service.admin project.service.tag project.service.feed project.service.effect project.service.channel \\
            project.service.like_consumer project.service.follow_consumer project.service.backup_consumer
`
opts = "h,help start: end: today=date last-7-days=date limit: prefix:"
const { options, args } = require("./option-parse-header").parse(help, opts)
const { genlogStat, renderStatToHTML } = require("./fetch-log")
const dateUtils = require("./date-utils")
const shell = require("./shell")


function normalizeForFilename(s) {
  return s.replace(/[:\s]/g, "_")
}
function getFileName(prefix) {
  return dateUtils.toYYYYmmdd_HHMMSS().replace(/[:\s]/g, "_").slice(0, "2020-12-10_16".length) + (prefix ? "_" + prefix : "") + ".html"
}

let start
let end
if (!options.start && !options.end) {
  let { date = "today" } = options
  if (date === 'today') {
    start = dateUtils.toDateBegin().getTime()
    end = dateUtils.toDateEnd().getTime()
  } else if (date === 'last-7-days') {
    end = dateUtils.toDateEnd().getTime()
    start = end - 7 * dateUtils.DAY
  }
}

if (!start || !end) {
  console.error("requires --start,--end")
  process.exit(1)
}

let { limit, file, prefix } = options
limit = Number(limit)
if (!limit || limit <= 0 || limit > 10000) {
  limit = 10000
}

let psmList = args
if (!psmList || psmList.length === 0) {
  console.error("requires psm")
  process.exit(1)
}

; (async () => {
  let logStat = await genlogStat(psmList, { limit, file, prefix, start, end })
  let html = renderStatToHTML(logStat)
  if (!file) {
    if (!prefix && psmList.length > 1) {
      file = normalizeForFilename(psmList.join("+") + "_" + dateUtils.toYYYYmmdd_HHMMSS()) + ".log.html"
    } else {
      file = getFileName(prefix)
    }
  }
  shell.write_f(file, html)
})()
