// A
// Asuffix
// Asuffix(1)
// Asuffix(2)
export function nextName(name, suffix) {
    if (!name) {
        return suffix
    }
    let idx = name.lastIndexOf(suffix)
    if (idx === -1) {
        return name + suffix
    }
    let endIdx = idx + suffix.length
    if (endIdx === name.length) {
        return name + "(1)"
    }
    if (name[endIdx] !== '(' || !name.endsWith(")")) {
        return name + suffix
    }
    let seq = Number(name.slice(endIdx + 1, name.length - 1))
    if (isNaN(seq) || seq <= 0) {
        return name + suffix
    }
    return name.slice(0, endIdx) + "(" + (seq + 1) + ")"
}