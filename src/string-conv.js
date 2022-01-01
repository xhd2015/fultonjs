

import vocaSplitWords from "voca/words"
import voca from "voca"

// voca/words bad case: IDs => ['I', 'Ds'], should be ["IDs"]
// these voca can do good
// IDNumber => ["ID", "Number"]
// whatSoEver =>  ["what", "So", "Ever"]
// HITElementX => ["HIT","Element","X"]
// the common bad case the voca cannot do good is that:
//    XXXYs, we think the s means complex
export function camelCaseSplitWords(sentence) {
    // assume original is camel case,then split them
    if (!sentence) {
        return []
    }
    const merged = []
    const words = vocaSplitWords(sentence) // $a => a, $ is lost
    const n = words.length
    for (let i = 0; i < n; i++) {
        const e = words[i];
        // the Xs pattern, excluding the first 
        if (merged.length > 0 && e?.length === 2 && e[1] === 's') {
            merged[merged.length - 1] += e
        } else {
            merged.push(e)
        }
    }
    return merged
}
// id safety
// $a => $a
export function camelCaseToSnakeCase(sentence, map) {
    const words = camelCaseSplitWords(sentence)
    const mapped = words.map(e => {
        const m = map?.(e)
        if (m) return m
        return e.toLowerCase()
    }
    ).join("_")
    return sentence?.startsWith("$") ? "$" + mapped : mapped
}
export function snakeCaseToCamelCase(sentence, map) {
    const words = vocaSplitWords(sentence)
    const mapped = words.map(e => {
        const m = map?.(e)
        if (m) return m
        if (e === 'id' || e === 'Id' || e === 'ID') {
            return "ID"
        } else if (e === 'ids' || e === 'Ids' || e === 'IDs' || e === 'IDS') {
            return "IDs"
        }
        return voca.capitalize(e)
    }).join("")
    return sentence?.startsWith("$") ? "$" + mapped : mapped
}