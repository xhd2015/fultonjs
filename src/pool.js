
export class Pool {
    constructor(size, checkInterval) {
        if (!(size > 0)) {
            throw new Error("invalid pool size")
        }
        if (!(checkInterval > 0)) {
            throw new Error("invalid checkInterval")
        }
        this._cap = size
        this._size = 0
        this._closed = false
        this._queue = []
        this._checker = setInterval(() => {
            // console.log("interval run:", this._size, this._cap)
            if (this._size >= this._cap) {
                return
            }
            const tasks = this._queue.splice(0, Math.min(this._cap - this._size, this._queue.length))
            for (let task of tasks) {
                this._size++
                let finallyRun = false
                try {
                    Promise.resolve(task.fn()).then(task.resolve).catch(task.reject).finally(() => {
                        if (!finallyRun) {
                            finallyRun = true
                            this._size--
                        }
                    })
                } catch (e) {
                    task.reject(e)
                    // if task.fn is not an async function, the finally clause will not reach
                    if (!finallyRun) {
                        finallyRun = true
                        this._size--
                    }
                }
            }
        }, checkInterval)
    }
    async withinPool(fn) {
        if (!fn) {
            throw new Error("fn must not be null")
        }
        if (this._closed) {
            throw new Error("pool closed")
        }
        return new Promise((resolve, reject) => {
            this._queue.push({ resolve, reject, fn })
        })
    }
    async close() {
        if (this._closed) {
            return
        }
        this._closed = true
        clearInterval(this._checker)
        const queue = this._queue
        this._queue = null
        for (let task of queue) {
            task.reject(new Error('pool closed'))
        }
    }
}