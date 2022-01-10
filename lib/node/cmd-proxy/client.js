const net = require("net");


async function exec(host, port, cmd) {
    if (cmd.incldues("\n")) {
        throw new Error("cmd should not contain newline")
    }
    return new Promise((resolve, reject) => {
        let output = ''
        const client = net.createConnection({ host, port }, () => {
            client.write('CONNECT ');
            client.write(cmd);
            client.write('\n')
        });
        client.on('data', (data) => {
            output += data
        });
        client.on('end', () => {
            resolve(output)
        });
        client.on('error', (e) => {
            reject(e)
        })
    })
}

module.exports = {
    exec
}


