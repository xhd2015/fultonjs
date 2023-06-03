"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLockFile = getLockFile;
exports.lock = lock;
exports.locked = locked;

var _promises = require("fs/promises");

var _str = require("./str");

var _at_exit = require("./at_exit");

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

function getLockFile(path) {
  [path] = (0, _str.trimSuffix)(path, "/");
  return path + ".lock";
} // try to lock
// consult: https://nodejs.org/api/fs.html


function lock(path, timeoutMs, preempty) {
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
      yield (0, _promises.writeFile)(pathLock, expireTime, {
        encoding: 'utf-8',
        flag: "w"
      });
    } else {
      // open the file if
      // wx+: read,write, fail if exists.
      // this ensures only one process create the lock
      let opened = true;
      let h = yield (0, _promises.open)(pathLock, "wx", 0o777).catch(e => {
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
          yield fh.writeFile(expireTime, {
            encoding: 'utf-8'
          });
        } finally {
          yield fh.close();
        }
      } else {
        // the lock exists
        // check timeout
        const content = yield (0, _promises.readFile)(pathLock, {
          encoding: 'utf-8'
        });
        let prevExpireMs = Number(content);
        let now = new Date().getTime(); // valid and not expired

        if (prevExpireMs > 0 && prevExpireMs > now) {
          return undefined;
        } // write the file with timeout


        expireTimeMS = now + timeoutMs;
        expireTime = String(expireTimeMS);
        yield (0, _promises.writeFile)(pathLock, expireTime, {
          encoding: 'utf-8',
          flag: "w"
        });
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

        unlocked = true; // unlock if expire the same

        const content = yield (0, _promises.readFile)(pathLock, {
          encoding: 'utf-8'
        });

        if (content !== expireTime) {
          return;
        }

        yield (0, _promises.rm)(pathLock);
      }),
      extendLock: timeoutMs => __awaiter(this, void 0, void 0, function* () {
        if (!(timeoutMs > 0)) {
          throw new Error("requires timeout");
        }

        const newExpireTimeMs = new Date().getTime() + timeoutMs;

        if (newExpireTimeMs <= expireTimeMS) {
          return;
        } // check if held the same lock


        const content = yield (0, _promises.readFile)(pathLock, {
          encoding: 'utf-8'
        });

        if (content !== expireTime) {
          return;
        } // update the lock


        const newExpireTime = String(newExpireTimeMs);
        yield (0, _promises.writeFile)(pathLock, newExpireTime, {
          encoding: 'utf-8',
          flag: "w"
        }); // refresh variables

        expireTime = newExpireTime;
        expireTimeMS = newExpireTimeMs;
      })
    };
  });
}

function locked(path, timeoutMs, preempty, action) {
  return __awaiter(this, void 0, void 0, function* () {
    const locker = yield lock(path, timeoutMs, preempty).catch(e => {});

    if (!locker) {
      return false;
    }

    let unlocked = false;
    (0, _at_exit.atExit)(() => {
      if (!unlocked) {
        unlocked = true;
        locker.unlock();
      }
    });

    try {
      yield action(locker);
      return true;
    } finally {
      unlocked = true;
      yield locker.unlock();
    }
  });
}