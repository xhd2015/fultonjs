export function isDigit(c) {
    return c >= '0' && c <= '9';
}
export function isLetter(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}
export function isUpperCaseLetter(c) {
    return (c >= 'A' && c <= 'Z');
}
export function isLowerCaseLetter(c) {
    return (c >= 'a' && c <= 'z');
}
export function isWord(c) {
    return isLetter(c) || c === '_' || c === '.';
}
