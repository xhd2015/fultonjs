import { FileHandle, open, readFile, rm as rmFile, writeFile } from "fs/promises"
import { join } from "path"
import { trimSuffix } from "./str"
import { atExit } from "./at_exit"

export function getLockFile(path: string): string {
    [path] = trimSuffix(path, "/")
    return path + ".lock"
}
export interface Locker {
    path: string
    pathLock: string
    unlock: () => Promise<void>,
    extendLock?: (timeoutMs: number) => Promise<void>,
}

// try to lock
// consult: https://nodejs.org/api/fs.html
export async function lock(path: string, timeoutMs: number, preempty?: boolean): Promise<Locker> {
    if (!(timeoutMs > 0)) {
        throw new Error("requires timeout")
    }
    const pathLock = getLockFile(path)
    let expireTime: string
    let expireTimeMS: number
    if (preempty) {
        expireTimeMS = new Date().getTime() + timeoutMs
        expireTime = String(expireTimeMS)
        await writeFile(pathLock, expireTime, { encoding: 'utf-8', flag: "w" })
    } else {

        // open the file if
        // wx+: read,write, fail if exists.
        // this ensures only one process create the lock
        let opened = true
        let h = await open(pathLock, "wx", 0o777).catch(e => {
            // if pathLock exists, returns 
            //    code: 'EEXIST',  syscall: 'open'
            // console.error("opened wx:", e)
            opened = false
        })

        if (opened) {
            expireTimeMS = new Date().getTime() + timeoutMs
            expireTime = String(expireTimeMS)
            const fh = h as FileHandle
            try {
                await fh.writeFile(expireTime, { encoding: 'utf-8' })
            } finally {
                await fh.close()
            }
        } else {
            // the lock exists
            // check timeout
            const content = await readFile(pathLock, { encoding: 'utf-8' })
            let prevExpireMs: number = Number(content)
            let now = new Date().getTime()
            // valid and not expired
            if (prevExpireMs > 0 && prevExpireMs > now) {
                return undefined
            }

            // write the file with timeout
            expireTimeMS = now + timeoutMs
            expireTime = String(expireTimeMS)
            await writeFile(pathLock, expireTime, { encoding: 'utf-8', flag: "w" })
        }
    }
    let unlocked = false

    return {
        path: path,
        pathLock: pathLock,
        // the unlock is not guranteed to unlock the same lock, but it will
        // try the best to do that
        unlock: async () => {
            if (unlocked) {
                return
            }
            unlocked = true
            // unlock if expire the same
            const content = await readFile(pathLock, { encoding: 'utf-8' })
            if (content !== expireTime) {
                return
            }
            await rmFile(pathLock)
        },
        extendLock: async (timeoutMs: number) => {
            if (!(timeoutMs > 0)) {
                throw new Error("requires timeout")
            }
            const newExpireTimeMs = new Date().getTime() + timeoutMs
            if (newExpireTimeMs <= expireTimeMS) {
                return
            }

            // check if held the same lock
            const content = await readFile(pathLock, { encoding: 'utf-8' })
            if (content !== expireTime) {
                return
            }

            // update the lock
            const newExpireTime = String(newExpireTimeMs)
            await writeFile(pathLock, newExpireTime, { encoding: 'utf-8', flag: "w" })

            // refresh variables
            expireTime = newExpireTime
            expireTimeMS = newExpireTimeMs
        },
    }
}

export async function locked(path: string, timeoutMs: number, preempty: boolean, action: (locker: Locker) => void | Promise<void>): Promise<boolean> {
    const locker = await lock(path, timeoutMs, preempty).catch(e => { })
    if (!locker) {
        return false
    }
    let unlocked = false
    atExit(() => {
        if (!unlocked) {
            unlocked = true
            locker.unlock()
        }
    })
    try {
        await action(locker)
        return true
    } finally {
        unlocked = true
        await locker.unlock()
    }
}