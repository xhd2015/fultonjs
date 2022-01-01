import { escapeShell, joinByOneSep } from "./string"
import qs from "qs"

// returns a string
// - options: {returnArray:false}
export function toCurlCommand(config, options) {
    let { returnArray = false } = options || {}
    let cmds = ['curl']

    // -x, --proxy [protocol://]host[:port] Use this proxy
    if (config.proxy) {
        let parts = []
        if (config.proxy.protocol) {
            parts.push(config.proxy.protocol + "://")
        }
        parts.push(config.proxy.host || "err_proxy_host")
        if (config.proxy.port) {
            parts.push(":" + config.proxy.port)
        }
        cmds.push("--proxy", parts.join(""))
    }

    // method
    if (config.method) {
        cmds.push("-X", config.method.toUpperCase())
    }
    let url = new URL(joinByOneSep(config.baseURL || '', config.url || '', '/'))
    if (config.params) {
        if (typeof config.params === 'string') {
            url.search = config.params
        } else {
            if (config.paramsSerializer) {
                url.search = config.paramsSerializer(config.params)
            } else {
                url.search = qs.stringify(config.params, { arrayFormat: 'repeat' })
            }
        }
    }
    // url
    cmds.push(url.toString())

    // headers
    for (let h in config.headers) {
        cmds.push("-H", h + ": " + config.headers[h])
    }
    if (config.data) {
        if (typeof config.data === string) {
            cmds.push("--data-raw", config.data)
        } else {
            cmds.push("--data-raw", JSON.stringify(config.data))
        }
    }

    if (!returnArray) {
        return cmds.map(e => escapeShell(e)).join(" ")
    }
    return cmds
}