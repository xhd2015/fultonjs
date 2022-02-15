"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isDigit = isDigit;
exports.isLetter = isLetter;
exports.isLowerCaseLetter = isLowerCaseLetter;
exports.isUpperCaseLetter = isUpperCaseLetter;
exports.isWord = isWord;

function isDigit(c) {
  return c >= '0' && c <= '9';
}

function isLetter(c) {
  return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z';
}

function isUpperCaseLetter(c) {
  return c >= 'A' && c <= 'Z';
}

function isLowerCaseLetter(c) {
  return c >= 'a' && c <= 'z';
}

function isWord(c) {
  return isLetter(c) || c === '_' || c === '.';
}