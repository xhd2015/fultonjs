export function isDigit(c: string) {
    return c >= '0' && c <= '9'
}
export function isLetter(c: string) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
}
export function isUpperCaseLetter(c: string) {
    return (c >= 'A' && c <= 'Z')
}
export function isLowerCaseLetter(c: string) {
    return (c >= 'a' && c <= 'z')
}
export function isWord(c: string) {
    return isLetter(c) || c==='_' || c==='.' 
}