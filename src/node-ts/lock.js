var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { open, readFile, rm as rmFile, writeFile } from "fs/promises";
import { trimSuffix } from "./str";
import { atExit } from "./at_exit";
export function getLockFile(path) {
    [path] = trimSuffix(path, "/");
    return path + ".lock";
}
// try to lock
// consult: https://nodejs.org/api/fs.html
export function lock(path, timeoutMs, preempty) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(timeoutMs > 0)) {
            throw new Error("requires timeout");
        }
        const pathLock = getLockFile(path);
        let expireTime;
        let expireTimeMS;
        if (preempty) {
            expireTimeMS = new Date().getTime() + timeoutMs;
            expireTime = String(expireTimeMS);
            yield writeFile(pathLock, expireTime, { encoding: 'utf-8', flag: "w" });
        }
        else {
            // open the file if
            // wx+: read,write, fail if exists.
            // this ensures only one process create the lock
            let opened = true;
            let h = yield open(pathLock, "wx", 0o777).catch(e => {
                // if pathLock exists, returns 
                //    code: 'EEXIST',  syscall: 'open'
                // console.error("opened wx:", e)
                opened = false;
            });
            if (opened) {
                expireTimeMS = new Date().getTime() + timeoutMs;
                expireTime = String(expireTimeMS);
                const fh = h;
                try {
                    yield fh.writeFile(expireTime, { encoding: 'utf-8' });
                }
                finally {
                    yield fh.close();
                }
            }
            else {
                // the lock exists
                // check timeout
                const content = yield readFile(pathLock, { encoding: 'utf-8' });
                let prevExpireMs = Number(content);
                let now = new Date().getTime();
                // valid and not expired
                if (prevExpireMs > 0 && prevExpireMs > now) {
                    return undefined;
                }
                // write the file with timeout
                expireTimeMS = now + timeoutMs;
                expireTime = String(expireTimeMS);
                yield writeFile(pathLock, expireTime, { encoding: 'utf-8', flag: "w" });
            }
        }
        let unlocked = false;
        return {
            path: path,
            pathLock: pathLock,
            // the unlock is not guranteed to unlock the same lock, but it will
            // try the best to do that
            unlock: () => __awaiter(this, void 0, void 0, function* () {
                if (unlocked) {
                    return;
                }
                unlocked = true;
                // unlock if expire the same
                const content = yield readFile(pathLock, { encoding: 'utf-8' });
                if (content !== expireTime) {
                    return;
                }
                yield rmFile(pathLock);
            }),
            extendLock: (timeoutMs) => __awaiter(this, void 0, void 0, function* () {
                if (!(timeoutMs > 0)) {
                    throw new Error("requires timeout");
                }
                const newExpireTimeMs = new Date().getTime() + timeoutMs;
                if (newExpireTimeMs <= expireTimeMS) {
                    return;
                }
                // check if held the same lock
                const content = yield readFile(pathLock, { encoding: 'utf-8' });
                if (content !== expireTime) {
                    return;
                }
                // update the lock
                const newExpireTime = String(newExpireTimeMs);
                yield writeFile(pathLock, newExpireTime, { encoding: 'utf-8', flag: "w" });
                // refresh variables
                expireTime = newExpireTime;
                expireTimeMS = newExpireTimeMs;
            }),
        };
    });
}
export function locked(path, timeoutMs, preempty, action) {
    return __awaiter(this, void 0, void 0, function* () {
        const locker = yield lock(path, timeoutMs, preempty).catch(e => { });
        if (!locker) {
            return false;
        }
        let unlocked = false;
        atExit(() => {
            if (!unlocked) {
                unlocked = true;
                locker.unlock();
            }
        });
        try {
            yield action(locker);
            return true;
        }
        finally {
            unlocked = true;
            yield locker.unlock();
        }
    });
}
