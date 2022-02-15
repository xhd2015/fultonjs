"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.quoteInShellDoubleQuotes = quoteInShellDoubleQuotes;
exports.quoteInShellPrintf = quoteInShellPrintf;

// suppose s will be used in "", escape all \ $  ` "
// after escape, s can be wrapped in "", another echo would completely print its original value
// e.g.
//      bash -c "escapeForDoubleQuotes(s)"
//  in this case s is the command you want to execute
// return:
//   guranteed no newline
function quoteInShellDoubleQuotes(s) {
  // '\n' -> "'\\n'"
  // $A   -> "\$A"
  // "\n  -> "\"\\n"
  return s.replaceAll("\\", "\\\\").replaceAll("$", "\\$").replaceAll("`", "\\`").replaceAll("\"", "\\\"").replaceAll("\n", "\\n");
} // supoose s will be used in printf "", escape all \ $ ` "
// e.g.
//     printf "quoteInShellPrintf(s)" | bash
// in this case s is the command that you want to pipe to bash 
// return:
//   guranteed no newline


function quoteInShellPrintf(s) {
  // '\n' ->  "'\\\\n'"
  // $A   ->  "\$A"
  // "\n  -> "\"\\\\n"
  // explaination:  the result of printf firstly undergoes bash's evaluation
  //                which means special sign: \ $ ` "  must be quoted
  //                then the argument is evaluated by printf itself
  //   the evaluation flow upon receiving is:   bash -> printf -> final
  //   so the escape flow upon sending is reversed:   bash <- printf <- final
  //         final -> printf: escape all \ as \\, % as %%
  //         printf -> bash:  escapeForDoubleQuotes 
  return quoteInShellDoubleQuotes(s.replaceAll("\\", "\\\\").replaceAll('%', '%%'));
} // suppose `s` will be used in a newline terminated string, where newline is recognized as a command boundary,so inside `s` all newline must be replaced.
// normally, newline can be replaced by ';'
//
// this is even more complicated when the newline is inside '', possibly it is outside the scope of simple replacement. Where newline is used as boundary, either use prefixed length or warn the user do not contain such thing.
// export function quoteNewLineInShell(s:string):string{
//     return ""
// }