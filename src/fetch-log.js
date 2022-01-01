import * as  dateUtils from "./date-utils"
import axios from "axios"
import { validate } from "./validate"

export const levelMap = {
  4: "Warn",
  5: "Error"
}

export const levelStrMap = {
  "Unknown": 0,
  "Debug": 1,
  "Notice": 2,
  "Info": 3,
  "Warn": 4,
  "Error": 5,
}

export class LogFetcher {
  constructor(client) {
    this.client = client || axios.request
  }

  async genlog(psmList, options) {
    let { start, end, limit } = options || {}
    if (limit == null || isNaN(limit)) {
      limit = 10000
    } else if (typeof limit !== 'number' || limit < 0 || limit > 10000) {
      throw new Error("limit should be in range:[0,10000],found:" + limit)
    }
    let endTime = end ? dateUtils.getTime(end) : dateUtils.toDateEnd().getTime()
    let startTime = start ? dateUtils.getTime(start) : endTime - 7 * dateUtils.DAY

    validate({ psmList, start: startTime, end: endTime })
    if (typeof psmList === 'string') {
      psmList = [psmList]
    }

    let psmMatch = psmList.map(PSM => ({ match_phrase: { PSM } }))
    let psmMatchParam = JSON.stringify(psmMatch)
    let param = createReqeustParam({ limit, beginTime: startTime, endTime: endTime, PSMMatchParam: psmMatchParam })

    let data = await this.client({
      url: 'http://log.somesite.com/elasticsearch/_msearch',
      headers: {
        "kbn-version": "6.2.3",
        "content-type": "application/x-ndjson"
      },
      data: param,
      // transformRequest: e => e,
      // transformResponse: e => e,
      method: "POST",
      // validateStatus: undefined,
    })
    // console.log("keys:" , Object.keys(data.data)) // [response]
    // console.log("response:", { ...data, data: undefined })

    let responses = data.data && data.data.responses || []
    return responses // logs
  }

  async genlogStat(psmList, options) {

    let logs = await this.genlog(psmList, options)
    let logStat = getRespStatistics(logs)
    return logStat
  }

}

let defaultFetcher = new LogFetcher()

// options: start,end,limit
export async function genlog(psmList, options) {
  return await defaultFetcher.genlog(psmList, options)
}

export async function genlogStat(psmList, options) {
  return await defaultFetcher.genlogStat(psmList, options)
}


// two lines,and must ends with a new line:
//    {"error":{"root_cause":[{"type":"illegal_argument_exception","reason":"The msearch request must be terminated by a newline [\\n]"}],"type":"illegal_argument_exception","reason":"The msearch request must be terminated by a newline [\\n]"},"status":400}
function createReqeustParam({ limit, beginTime, endTime, PSMMatchParam }) {
  return `{"index":["*:tt_err_log-*"],"ignore_unavailable":true,"preference":1597052670815}
{"version":true,"size":${limit},"sort":[{"Time":{"order":"desc","unmapped_type":"boolean"}}],"_source":{"excludes":[]},"aggs":{"2":{"date_histogram":{"field":"Time","interval":"30m","time_zone":"Asia/Shanghai","min_doc_count":1}}},"stored_fields":["*"],"script_fields":{},"docvalue_fields":["Time"],"query":{"bool":{"must":[{"match_all":{}},{"match_phrase":{"Level":{"query":5}}},{"bool":{"minimum_should_match":1,"should":${PSMMatchParam}}},{"range":{"Time":{"gte":${beginTime},"lte":${endTime},"format":"epoch_millis"}}}],"filter":[],"should":[],"must_not":[]}},"highlight":{"pre_tags":["@kibana-highlighted-field@"],"post_tags":["@/kibana-highlighted-field@"],"fields":{"*":{}},"fragment_size":2147483647}}
`
}

// get response statistics
// returns: 
//   {count, logs:{<psm>:{count, data:{<location>:{count, data:[cluster,host,stage,level, log, time,dc]  }}} }
function getRespStatistics(responses) {
  let locationIdx = 0
  let psmUnknownIdx = 0

  // PSM -> location -> message
  let errors = {}
  let logStat = {
    logs: errors,
    count: 0
  }
  // statistics for each PSM
  responses.forEach(resp => {
    // resp:{
    //      took:117, 
    //      timed_out:false, 
    //       _shards: { total: 261, successful: 261, skipped: 234, failed: 0 },
    //      _clusters: { total: 3, successful: 3, skipped: 0 }
    //      hits:{
    //         total:351,
    //         max_score: null, 
    //         hits:[]
    //   }
    // }
    let hits = (resp["hits"] || {})["hits"] || []
    hits.forEach(hit => {
      // hit:{
      //    _index: 'lq:tt_err_log-2020.12.31',
      //    _type: 'log',
      //    _id:'h--9tnYBe7lyas89Lrny',
      //   _version:1,
      //   _score: null,
      //   _source:{
      //       Level:5, Time:113243234, PSM, Cluster
      //       Stage, Host, Location, Log
      //       Version
      //  }
      // }
      let source = hit["_source"] || {}
      let log = source["Log"] || ""
      let cluster = source["Cluster"] || ""
      // used to lookup env
      let host = source["Host"] || ""
      let stage = source["Stage"] || ""
      let psm = source["PSM"] || `Unknown_PSM_${psmUnknownIdx += 1}`
      let time = Number(source["Time"]) || 0
      let timeStr = dateUtils.toYYYYmmdd_HHMMSS(time)
      //  Time.at(time/1000).strftime("%Y-%m-%d %H:%M:%S")
      let level = source["Level"]
      let levelStr = levelMap[level] || "Unknown"
      let location = source["Location"] || `Unknown_Location_${locationIdx += 1}`

      errors[psm] = errors[psm] || {}
      let psmMap = errors[psm]

      // increment count
      logStat["count"] += 1
      psmMap["count"] = (psmMap["count"] || 0) + 1

      psmMap["data"] = psmMap["data"] || {}
      let psmData = psmMap["data"]

      psmData[location] = psmData[location] || {}
      let locationMap = psmData[location]

      locationMap["count"] = (locationMap["count"] || 0) + 1
      locationMap["data"] = locationMap["data"] || []
      locationMap["data"].push({
        cluster,
        host,
        stage,
        "level": levelStr,
        "log": log,
        "time": timeStr,
        "dc": source["Dc"],
      })
    })
  })
  return logStat
}


// render convienent:
let seriviceUnavailableRule = {
  "rule": /message=Service Unavailable/,
  "action": "ignore",
  "reason": "框架层错误"
}
let networkErrorRule = {
  "rule": /i\/o timeout/,
  "action": "ignore",
  "reason": "网络错误"
}

let bizServiceUnavailable = {
  "rule": /10001 message=Service Unavailable/,
  "action": "ignore",
  "reason": "下游、DB或Redis不可用错误"
}

let generalRules = [networkErrorRule,
  {
    "rule": /KITEX: processing request error, remote=.*, err=flush connection has been closed/,
    "action": "ignore",
    "reason": "kitex框架错误"
  },
  {
    "rule": /(?:err=dial tcp|err=read tcp|err-read tcp).*i\/o timeout/,
    "action": "ignore",
    "reason": "I/O超时"
  },
  {
    "rule": /remote or network error: default codec read failed: connection read timeout/,
    "action": "ignore",
    "reason": "网络错误:连接断开"
  },
  bizServiceUnavailable,
  seriviceUnavailableRule,
  {
    rule: /KE.MESH\/3 - \?\/1115: cds_key=INGRESS/,
    action: "ignore",
    reason: "Mesh错误"
  },
  {
    rule: /KITEX:.*err=cds_key=EGRESS.*reason=request timeout/,
    action: "ignore",
    reason: "Mesh错误:请求超时"
  },
  {
    rule: /EmitCounter err:emit buffer full/,
    action: "ignore",
    reason: "打点错误"
  }
]


function createDiagnoseMap() {
  return {
    "project.service.api": [
      {
        "rule": /guess scramble word err: status=40001 message=Insufficient Fund/,
        "action": "ignore",
        "reason": "观众选词,调用project.service_other.core返回送礼资金不足,客户端会提示观众余额不足"
      },
      {
        "rule": /game effect handler err: status=40001 message=Insufficient Fund/,
        "action": "ignore",
        "reason": "观众选词,调用project.service_other.core返回送礼资金不足,客户端会提示观众余额不足"
      },
      {
        "rule": /guess get prompt err: status=40001 message=Insufficient Fund/,
        "action": "ignore",
        "reason": "观众选词,调用project.service_other.core返回送礼资金不足,客户端会提示观众余额不足"
      }
    ],

    "project.service.interact": [
      {
        "rule": /get app entrance fail\. appID=36/,
        "action": "ignore",
        "reason": "懂车帝将西瓜的SDK能力整体迁移,但没有游戏能力,没有相关loki配置,因此请求的接口可以忽略掉"
      }
    ],
    "project.service.invite": [],
    "project.service.info": [
      {
        "rule": /FinishGame get use status failed err:status=4014021/,
        "action": "ignore",
        "reason": "小游戏客户端重复调用FinishGame,目前没有整改计划"
      },
      {
        "rule":/client stop reason is invalid, will use ClientStop instead/,
        "action":"ignore",
        "reason":"旧版本客户端stop_reason未设置，使用默认值"
      }
    ],
    "project.service.present": [
      {
        "rule": /you have a game in process, cant disable another game: inProcessGameID=0/,
        "action": "fixing",
        "reason": "在停止玩法时所有玩法都被停止,不检查是否开启,因此出现错误日志 @黄雄盛"
      }
    ],
    "project.service.open": [
      {
        "rule": /get follow info request param err.*RoomID:0 PlayKind:4001/,
        "action": "fixing",
        "reason": "客户端project_sdk_version低版本错误,高版本1660修复,有一些存量"
      },
      {
        "rule": /room have no play kind err: status=4014017/,
        "action": "fixing",
        "reason": "未知  @黄雄盛"
      }
    ],
    "project.service.follow_consumer": [
      {
        "rule": /follow message param is illegal\./,
        "action": "ignore",
        "reason": "客户端project_sdk_version低版本错误,高版本1660修复,有一些存量(错误提前)"
      }
    ],
    "project.service.like_consumer": [],
    "project.service.gift_consumer": [],
    "project.service_other.api": [
      {
        "rule": /Report failed, anchorID is/,
        "action": "ignore",
        "reason": "错误码忽略"
      }
    ],
    "project.service_other.room_consumer": [
      {
        "rule": /get quiz from local cache failed/,
        "action": "ignore",
        "reason": "读缓存错误"
      },
      {
        "rule": /read quiz err.*message=cache failed/,
        "action": "ignore",
        "reason": "读缓存错误"
      },
      {
        "rule": /reload room tags cache failed,/,
        "action": "ignore",
        "reason": "读缓存错误"
      }
    ],
    "project.service_other.base": [
      {
        "rule": /Bet service run failed, error is status=600002/,
        "action": "ignore",
        "reason": "竞猜已截止"
      },
      {
        "rule": /get play gain failed/,
        "action": "ignore",
        "reason": "误打印错误日志"
      },
      {
        "rule": /pay money failed, userID is/,
        "action": "ignore",
        "reason": "误打印错误日志"
      },
      {
        "rule": /transfer property failed\. err/,
        "action": "ignore",
        "reason": "转账资金不足"
      }
    ],
    "project.service_other.info": [
      {
        "rule": /read quiz from cache failed\./,
        "action": "ignore",
        "reason": "读缓存错误"
      }
    ],

    "project.service.effect": [{
      "rule": /profit core send gift err: status=40001 message=Insufficient Fund,/,
      "action": "ignore",
      "reason": "观众选词,调用project.service_other.core返回送礼资金不足,客户端会提示观众余额不足"
    }, {
      "rule": /start with audience word\. userID=/,
      "action": "ignore",
      "reason": "代码中日志级别错误,应当改成Info"
    },
    {
      rule: /scramble word but have choose word\./,
      action: "ignore",
      reason: "多个观众抢词,其中一个观众抢词成功,其他观众抢词失败"
    },
    {
      rule: /cat review prohibit/,
      action: "ignore",
      reason: "主播给小猫名称违规"
    },
    {
      rule: /update age interval too large:\w+s, ignore it and set age cache/,
      action: "ignore",
      reason: "小猫更新周期>600s"
    }
    ],
  }
}

export function defaultDiagnoseMapGetter(psmList) {
  let diagnoseMap = createDiagnoseMap()

  // initialize
  psmList.forEach(psm => {
    diagnoseMap[psm] = diagnoseMap[psm] || []
  })
  for (let k in diagnoseMap) {
    let v = diagnoseMap[k]
    generalRules.forEach(rule =>
      v.push(rule)
    )
  }

  // get ignore rule, nil if non match
  function getDiagnose(psm, log) {
    for (let rule of diagnoseMap[psm] || []) {
      // regex test
      if (rule.rule.test(log)) {
        return rule
      }
    }
  }
  return getDiagnose
}
export function renderStatToHTML(logStat, options) {
  let { showCount = 1, getDiagnose } = options || {}
  let logStatCount = logStat["count"]
  let errors = logStat["logs"]
  if (!getDiagnose) {
    getDiagnose = defaultDiagnoseMapGetter(Object.keys(errors))
  }
  let h = ""
  h += `<html>
      <head>
        <meta charset="utf-8">
        <title>Errors</title>
      </head>
      <body>
`
  h += `<p>Total: <span>${logStatCount}</span></p>`
  h += "<ul>"
  for (let psm in errors) {
    let psmStat = errors[psm]
    // sort by count in decreasing order
    let psmCount = psmStat["count"]
    let maps = psmStat["data"]
    // { location : { count ,data:[{log}] } }
    let mapsArray = Object.keys(maps).map(k => [k, maps[k]])
    // sort by count in descende order
    mapsArray.sort((a, b) => b[1].count - a[1].count)

    let ratio = psmCount * 100.0 / logStatCount
    let ratioStr = ratio.toFixed(1)
    h += `<p>
      <span style="color: forestgreen">${psm}</span>&nbsp;&nbsp;<span>Total <span>${psmCount}</span></span>&nbsp;&nbsp;
      <span>${ratioStr}%</span>
    </p>`
    h += "<ul>"
    mapsArray.forEach(([location, data]) => {
      let count = data.count
      let logList = data.data || []
      h += `  <li> &nbsp;&nbsp;<span>${location}</span>
           <span>Total <span style="color: grey">${count}</span></span>`
      for (let i = 0; i < showCount; i++) {
        if (i >= logList.length) {
          break
        }
        let item = logList[i] || {}
        let log = item.log || ""
        let logColor = "navy"
        let diagnose = getDiagnose(psm, log)
        let reason = ""
        let reasonColor = ""
        let action = diagnose && diagnose.action

        if (diagnose && action !== 'comment') {
          reason = diagnose.reason || ""
          if (action === 'ignore') {
            logColor = "grey"
            reasonColor = "grey"
          } else if (action === "fixing") {
            reasonColor = "grey"
          }
        }
        h += `<p style="color: ${logColor};font-size: larger;font-family: monospace;">${log}`
        if (action === "fixing") {
          h += `<span style="color: green; font-size: smaller; font-style: italic;">fixing</span>`
        }
        h += "</p>"
        if (reason) {
          h += `<p style=\"color: ${reasonColor}\">${reason}</p>`
        }
      }
      h += "</li>"
    })
    h += "</ul>"
  }

  h += "</ul></body></html>"
  return h
}
