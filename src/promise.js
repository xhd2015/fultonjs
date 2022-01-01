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

// f: Promise or function
// returns: a promise that resolves f what f returns or resolves
export function resolveFunctional(f) {
    if (!(f instanceof Function)) {
        return Promise.resolve(f)
    }
    return new Promise(resolve => resolve(Promise.resolve(f())))
}