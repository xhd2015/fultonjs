
// get login script and get logged in through relay host
async function getLoginScript(host, port, namespace, podName) {
    // { stty raw;printf 'CONNECT { printf "PS1=\\${PS1/\\x27\\\\$\\x27*/\\x27\\\\\\n\\\\$ \\x27}\\n\\x0c";cat -;} | script -q /dev/null -c "kubectl exec -it -n credit-bill-v2-test-id bill-v2-id-server-test-7979cfc499-64sbk  --  /bin/bash --login -i"\n' printf 'CONNECT script -q /dev/null -c "kubectl exec -it -n credit-bill-v2-test-id bill-v2-id-server-test-7979cfc499-64sbk  --  /bin/bash --login -i"\n'; cat -; }  | nc 10.129.99.198 9098; stty sane
    // CTRL-L = \x0c
    // PS1=${PS1/'\$'*/'\n\$ '}
    // ' = \x27
    // because nodejs has no way to declare RAW string like r'something' in python, so we double each \ to \\, partially solves this problem

    // check if PS1 has newline,if not, add one
    const clearAfterSetup = false // TODO: use as an option
    const ctrlC = "\\x0c" // CTRL-C: clear the screen
    // full command example:
    //     
    const innerCommand = `kubectl exec -it -n ${namespace} ${podName}  --  /bin/bash --login -i`
    // just double each \ would give a correct escape
    //     PS1=${PS1%%$'\\n'*}   => remove \n and after
    //     PS1=${PS1//$'\\n'/}   => remove all other \n
    //     [ $PS1 != *'\n'* ] && PS1=${PS1/'\$'*/'\n\$ '}
    // provides the following command:
    //     g = grep_log = grep --color $1 log/all.log
    //     f = tailf_log = tail -fn1000 log/all.log
    const setup = "PS1=${PS1%%$'\\n'*};PS1=${PS1//$'\\n'/};PS1=${PS1/'\\$'*/' $POD_IP \\t ($(cat /etc/timezone))\\n\\$ '}\n" +
        "{\n" +
        "    function grep_log     { grep --color \"$1\" log/all.log; }\n" +
        "    function grep_all_log { grep --color \"$1\" log/*.log;   }\n" +
        "    function tailf_log    { tail -fn1000 log/all.log;        }\n" +
        "}\n" +
        "{\n" +
        "    alias g=grep_log      # example: g INFO    =>  search 'INFO' in log/all.log\n" +
        "    alias f=tailf_log     # example: f         =>  follows the last 1000 lines of log/all.log\n" +
        "    alias fg='f|grep'     # example: fg INFO   =>  search 'INFO' from the last 1000 lines of log/all.log, continuously\n" +
        "}"

    const cmdOnToc = `CONNECT { printf "${escapeForPrintf(setup)}\\n${clearAfterSetup ? ctrlC : ""}"; cat -; }|script -q /dev/null -c "${escapeForDoubleQuotes(innerCommand)}"`

    // script -q /dev/null -c "kubectl exec -it -n credit-pay-v2-test-id pay-v2-id-server-test-98569cfd8-hmvwv  --  /bin/bash --login
    return `stty raw
{ 
    printf "${escapeForPrintf(cmdOnToc)}\\n"
    cat - 
}|nc ${host} ${port}
stty sane
`
}