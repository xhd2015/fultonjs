/**
 * get 2d feature of a string, that is:
 * length and indexed sum of each character of s:
 *     s[i]*i
 * @param {string} s 
 */
export function indexedSum(s) {
    if (!s) {
        return 0
    }
    let sum = 0
    let segment = 10
    for (let i = 0; i < s.length; i++) {
        sum += s.charCodeAt(i) * ((i + 1) % segment)
    }
    return sum
}

export function get2DFeature(s) {
    return {
        length: s && s.length || 0,
        sum: indexedSum(s)
    }
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    let help = `usage: method args`
    let { args, options } = require("./option-parse-header").parse(help, "h,help")
    let method = args[0]

    let result = module.exports[method](...args.slice(1))

    console.log(result)
}