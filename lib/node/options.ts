// parse options  (CommonJS syntax)
'use strict'

// usage:
//   help=`
// Usage: foobar OPTIONS <FILE>
//
// Options:
//   -h, --help        show help
//
// Example:
//`
//   const {options,args} = require("option-parse-header").parse(help,opts)
// Installation:
//    for CommonJS, this file must appear under NODE_PATH,so:
//        export NODE_PATH=`npm root -g`
//    
//    test:
//       node -e 'const {options,args} = require("option-parse-header").parse("help","h,help a b,boo: c,cool:: d,dark:=mass");console.log(options);console.log(args)'  -- - -a -b 10 --cool=hello -c world -cloo -d kick --dark ol - -- online me
//       {
//          a: true,
//          boo: '10',
//          cool: [ 'hello', 'world', 'loo' ],
//          mass: 'dark',
//          dark: 'ol'
//        }
//        [ '-', 'online', 'me' ]
//
//    Note for import this file:
//        for CommonJS:  just place this file under `npm root -g` (/path/to/system/node_modules), and ensure that NODE_PATH contains `npm root -g`
//        for ES:  import failed, currently does't find a good way to import ES module from ES Code, successful case is to import ES module from CJS Code

export interface Options<T> {
    args: string[]
    // options: { [option: string]: boolean | string | string[] }
    options: T
    getHelp: () => string
}

type OptionRepeat = "zero" | "many" | "one"

export interface ParseOptions {
    argv?: string[]

    // stop parsing flags when seeing the first arg
    // usually used for sub-commands
    stopAtFirstArg?: boolean
}

// - opts  description  "h,help a b,bang c,cool: d,dark:=m e,earray::"
//    separated by space, each can have a short and long option name
// d,dark:=m   short name is d, long name is dark, accept one option, the =m suffix is a grouping suffix, meaning if multiple option has =m, then the last option x with =m will have "m":x set.
export function parse<T>(help: string, opts: string, argv?: string[] | ParseOptions, parseOpts?: ParseOptions): Options<T> {
    // handle overload
    if (argv) {
        // console.log("shift1:", argv)
        if (!parseOpts && !Array.isArray(argv)) {
            // console.log("shift:", argv)
            parseOpts = argv as any
            argv = parseOpts?.argv
        }
    }
    if (argv == null) {
        //  process.argv[0] = node
        //  process.argv[1] = jsfile
        argv = process.argv.slice(2)
    }

    const actualArgv: string[] = argv as string[]
    // console.log("argv:", argv)
    const optList = opts.split(/\s+/)
    // map a option to target option
    const optionNameMap = {}
    const optionRepeat: { [option: string]: OptionRepeat } = {} // zero, one, many
    const aliasMap = {}
    const stopAtfirstArg = parseOpts?.stopAtFirstArg

    for (let opt of optList) {
        let optAlias
        let aliasIdx = opt.lastIndexOf("=")
        if (aliasIdx != -1) {
            optAlias = opt.slice(aliasIdx + 1)
            opt = opt.slice(0, aliasIdx)
        }
        let optRepeat: OptionRepeat = "zero"
        if (opt.endsWith("::")) {
            optRepeat = "many"
            opt = opt.slice(0, opt.length - 2)
        } else if (opt.endsWith(":")) {
            optRepeat = "one"
            opt = opt.slice(0, opt.length - 1)
        }

        const optNames = opt.split(",")
        if (optNames.length == 0) {
            continue
        }
        const mapName = optNames[optNames.length - 1]
        if (optionRepeat[mapName] != null) {
            throw new Error(`duplicate option name:${mapName}`)
        }
        optionRepeat[mapName] = optRepeat
        if (optAlias) {
            aliasMap[mapName] = optAlias
        }
        for (const optName of optNames) {
            if (optName.length == 0) {
                continue
            }
            if (optionNameMap[optName] != null) {
                throw new Error(`duplicate option name:${optName}`)
            }
            optionNameMap[optName] = mapName
        }
    }

    const args: string[] = []
    const options = {} as T
    const AUTO_ARG_NULL_OR_BOOL = {}

    // used to iterate argv
    let i = 0
    function emitArg(optName, arg) {
        let detect = arg === AUTO_ARG_NULL_OR_BOOL
        // clear arg if detect, avoid subtle bug
        if (detect) {
            arg = null
        }
        const mapName = optionNameMap[optName]
        if (!mapName) {
            throw new Error(`no such option:${optName}`)
        }
        const mapAlias = aliasMap[mapName]
        if (mapAlias) {
            options[mapAlias] = optName
        }
        // can use on|off, true|false to turn off 
        if (optionRepeat[mapName] === 'zero') {
            if (detect) {
                options[mapName] = true
                return
            }
            if (arg != null) {
                if (arg == "on" || arg == "On" || arg == "ON" || arg == "true" || arg == "True" || arg == "TRUE") {
                    options[mapName] = true
                } else if (arg == "off" || arg == "Off" || arg == "OFF" || arg == "false" || arg == "False" || arg == "FALSE") {
                    options[mapName] = false
                } else {
                    throw new Error(`option requires no argument:${optName},except on/On/ON/true/True/TRUE or off/Off/OFF/false/False/FALSE`)
                }
            } else {
                options[mapName] = true
            }
        } else if (optionRepeat[mapName] === 'one') {
            if (detect) {
                arg = argv[++i]
            }
            if (arg == null) {
                throw new Error(`option requires one argument:${optName}`)
            }
            options[mapName] = arg
        } else if (optionRepeat[mapName] === 'many') {
            if (detect) {
                arg = argv[++i]
            }
            if (arg == null) {
                throw new Error(`option requires argument:${optName}`)
            }
            if (options[mapName] == null) {
                options[mapName] = [arg]
            } else {
                (options[mapName] as string[]).push(arg)
            }
        } else {
            throw new Error(`unknown option repeat:${optName} ${optionRepeat[mapName]}`)
        }
    }
    // now, parse the argv
    for (; i < actualArgv.length; i++) {
        // console.log("shit:", argv, i)
        const arg = argv[i]
        if (arg == '--') {
            args.push(...actualArgv.slice(i + 1))
            break
        } else if (arg == '-') { // is also a valid argument
            args.push(arg)
            continue
        }
        if (arg.startsWith('--')) {
            let optName = arg.slice(2)
            const eqIdx = optName.lastIndexOf("=")
            let optArg
            if (eqIdx != -1) {
                optArg = optName.slice(eqIdx + 1)
                optName = optName.slice(0, eqIdx)
            } else {
                optArg = AUTO_ARG_NULL_OR_BOOL
            }
            emitArg(optName, optArg)
        } else if (arg.startsWith('-')) {
            const optName = arg.slice(1)
            if (optName.length == 1) {
                emitArg(optName, AUTO_ARG_NULL_OR_BOOL)
                continue
            }
            // many short options
            const firstOpt = optName[0]
            const mapOpt = optionNameMap[firstOpt]
            const optReapt = optionRepeat[mapOpt]
            if (optReapt == 'one' || optReapt == 'many') {
                emitArg(firstOpt, optName.slice(1))
            } else if (optReapt == 'zero') {
                // all but the last one,should be zero opt
                for (const shortOpt of optName.slice(0, optName.length - 1)) {
                    emitArg(shortOpt, null)
                }
                // last one detect
                emitArg(optName[optName.length - 1], AUTO_ARG_NULL_OR_BOOL)
            }
        } else {
            // console.log("stopAtfirstArg:", stopAtfirstArg)
            if (stopAtfirstArg) {
                // console.log("stop:", argv, i)
                args.push(...actualArgv.slice(i))
                break
            } else {
                args.push(arg)
            }
        }
    }
    function getHelp() {
        let h = help
        if (h.startsWith("\n")) {
            h = h.slice(1)
        }
        if (h.endsWith("\n")) {
            h = h.slice(0, h.length - 1)
        }
        return h
    }
    if (options["help"] === true) { // only expects bool true
        console.log(getHelp())
        process.exit(0)
    }
    return { args, options, getHelp }
}