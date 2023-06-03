let atExits = [];
export function atExit(f) {
    atExits.push(f);
}
function doExits() {
    // console.log("exits:", atExits.length)
    const exits = atExits;
    atExits = [];
    exits.forEach(f => {
        try {
            const p = f();
            if (p.catch) {
                p.catch(e => {
                    // ignore
                });
            }
        }
        catch (e) {
            // ignore
        }
    });
}
// if you press ^C on bash, it will exit with 130
function exitProcess(code) {
    doExits();
    process.exit(code);
}
process.on('SIGINT', () => exitProcess(1));
process.on('SIGQUIT', () => exitProcess(1));
process.on('SIGTERM', () => exitProcess(1));
process.on('exit', doExits);
