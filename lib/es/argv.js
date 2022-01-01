const StateWord = 1
const StateSingleQuote = 2
const StateDoubleQuote = 3

// s should be started with \, and returns the
// word represented and count of characters used
// in s, that is end of the escape sequence
export function evalEscape(s) {
    if (!s || !s.startsWith("\\")) {
        throw new Error("escape must start with \\, found:" + s)
    }
    let c = s[1]
    if (c == null) {
        return ["\\", 1]
    }
    switch (c) {
        case 'n':
            return ["\n", 2]
        case 't':
            return ["\t", 2]
        case 'r':
            return ["\r", 2]
        case "\\":
            return ["\\", 2]
        case "\n": // the case:   \<newline>...
            return ["", 2]
        default:
            return [c, 2]
    }
}

// if recordCmd, then returns a list of command: [{command:"", split:[]}]
function splitCommandHelper(cmd, recordCmd, keepEnd, debug) {
    let recordArgv = []
    let recordArgvSlit
    let recordCmdStart

    let argv = []
    let state = StateWord
    let nextState
    let lastQuoteStart
    let lastIsTerminal = true

    let i = 0

    let word = ''
    let wordHasQuote = false
    function finishAWord() {
        if (word || wordHasQuote) {
            if (debug) {
                console.log("finishAWord:", word)
            }
            if (recordCmd) {
                if (recordArgvSlit == null) {
                    recordArgvSlit = [word]
                } else {
                    recordArgvSlit.push(word)
                }
            } else {
                argv.push(word)
            }
            word = ''
            wordHasQuote = false
        }
    }

    // c could be ;, \n, or null(the end)
    function finishACommand(c) {
        if (debug) {
            console.log("finishACommand:", argv, recordArgvSlit, recordCmdStart)
        }
        if (recordCmd) {
            if (recordArgvSlit) {
                let end = i + 1
                if (!keepEnd && c) {
                    end--
                }
                recordArgv.push({
                    command: cmd.slice(recordCmdStart || 0, end),
                    split: recordArgvSlit
                })
                recordArgvSlit = null
            }
        } else {
            if (c != null) {
                argv.push(c)
            }
        }
        lastIsTerminal = true
    }

    for (; i < cmd.length; i++) {
        let c = cmd[i]
        if (lastIsTerminal) {
            recordCmdStart = i
            lastIsTerminal = false
        }
        if (state === StateWord) {
            if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === ';') {
                nextState = StateWord
                finishAWord()
                if (c === ';' || c === '\n') {
                    finishACommand(c)
                }
            } else if (c === "'") {
                nextState = StateSingleQuote
                wordHasQuote = true
                lastQuoteStart = i
            } else if (c === '"') {
                nextState = StateDoubleQuote
                wordHasQuote = true
                lastQuoteStart = i
            } else if (c === '\\') {
                nextState = StateWord
                let [part, count] = evalEscape(cmd.slice(i))
                i += count - 1
                word += part
            } else {
                nextState = StateWord
                word += c
            }
        } else if (state === StateSingleQuote) {
            if (c === "'") {
                nextState = StateWord
            } else {
                nextState = StateSingleQuote
                word += c
            }
        } else if (state === StateDoubleQuote) {
            if (c === '\\') {
                nextState = StateDoubleQuote
                let [part, count] = evalEscape(cmd.slice(i))
                i += count - 1
                word += part
            } else if (c === '"') {
                nextState = StateWord
            } else {
                nextState = StateDoubleQuote
                word += c
            }
        }

        // next state
        state = nextState

        // last
        if (i >= cmd.length - 1) {
            if (state !== StateWord) {
                throw new Error("unclosed string:" + cmd.slice(Math.max((lastQuoteStart || 0) - 10, 0)))
            }
            finishAWord()
            finishACommand()
        }
    }
    return recordCmd ? recordArgv : argv
}
// new command is splitted by \n or ;
// if options.
export function splitCommand(cmd) {
    return splitCommandHelper(cmd, false)
}

// parse into commands, ; is used to separate multiple commands
// example: parseCommands('get a;set a', keepCommand=false) => [["get","a"]], ["set","a"]]
// example: parseCommands('get a;set a', keepCommand=true) => [{command:"get","a", split:["get","a"]}, {"command":"set a", split:["set","a"]}]
export function parseCommands(cmdStr, keepCommand, keepEnd) {
    if (!keepCommand) {
        let parsed = splitCommandHelper(cmdStr, false)
        let cmds = []
        let cmd = null
        for (let word of parsed) {
            if (word === ';' || word === "\n") {
                if (cmd) {
                    cmds.push(cmd)
                    cmd = null
                }
            } else {
                if (cmd == null) {
                    cmd = [word]
                } else {
                    cmd.push(word)
                }
            }
        }
        if (cmd) {
            cmds.push(cmd)
        }
        return cmds
    } else {
        return splitCommandHelper(cmdStr, true, keepEnd)
    }
}