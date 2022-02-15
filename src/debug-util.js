export function makeDebug(debug) {
    return function (...args) {
        {
            if (!debug) {
                return;
            }
            console.log("DEBUG ", ...args);
        }
    };
}
