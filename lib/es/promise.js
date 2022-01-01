// wait for n milliseconds
// returns Promise
export function wait(n) {
    n = Number(n)
    return new Promise((resolve, reject) => {
        if (n > 0) {
            setTimeout(resolve, n)
        } else {
            resolve()
        }
    })
}
