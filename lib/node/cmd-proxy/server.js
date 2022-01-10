const net = require("net");
const child_process = require("child_process");

//
// client connect to this:
// to macos server:
//    stty raw;{ printf 'CONNECT script /dev/null bash --login -i\n'; cat - ; } |nc localhost 9098;stty sane
// to linux server:
//    stty raw;{ printf 'CONNECT script -q /dev/null -c "bash --login -i"\n'; cat - ; } |nc test.toc 9098;stty sane

const host = "0.0.0.0"
const port = process.env.PORT || 9098
function handleConnection(socket) {
    let firstLine = ''
    let child

    socket.on('error', function (err) {
        console.log("socket error:", err, socket.address())
        if (child) {
            console.log("killing subprocess:", child.pid)
            child.kill()
        }
    })

    // first line is processed
    socket.on('data', function (chunk) {
        console.log("[DEBUG] socket data:", chunk.toString())
        if (child) {
            child.stdin.write(chunk)
            return
        }
        // handle first line
        for (let i = 0; i < chunk.length; i++) {
            // \n
            if (chunk[i] === 0xa) {
                if (!firstLine.startsWith("CONNECT ")) {
                    socket.write("bad head line, must be 'CONNECT command'");
                    socket.end()
                    return
                }
                const command = firstLine.slice("CONNECT ".length);
                if (!command) {
                    socket.write("bad head line, no command specified");
                    socket.end()
                    return
                }
                child = child_process.spawn("bash", ["-c", command]);
                if (child.pid) {
                    console.log("spawn command pid:", child.pid, command)
                }
                child.on('exit', function (code) {
                    console.log("cmd exit:", code, command)
                    socket.end()
                })
                child.on('error', function (err) {
                    console.log("cmd error:", err, command)
                    socket.end()
                })
                child.stdout.pipe(socket);
                child.stderr.pipe(socket);
            }
            firstLine += String.fromCharCode(chunk[i]);
        }
    })
}

const server = net.createServer(function (socket) {
    handleConnection(socket)
})

server.on('error', function (e) {
    // if bind already:
    //     Error: listen EADDRINUSE: address already in use 0.0.0.0:9098
    console.error("server error:", e)
})

server.listen({
    port: port,
    host: host,
}, function () {
    // no arg
    // called if address not binding
    console.log(`Server listen on:${host}:${port}`)
})

process.on('SIGINT', function () {
    console.log("Caught interrupt signal");
    process.exit();
});