"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cat = cat;
exports.cat_bin = cat_bin;
exports.cat_silent = cat_silent;
exports.chomp = chomp;
exports.cmdDir = cmdDir;
exports.cmdRel = cmdRel;
exports.cp = cp;
exports.cp_rf = cp_rf;
exports.deepwatch = deepwatch;
exports.error = error;
exports.esc = esc;
exports.escape = escape;
exports.exec = exec;
exports.execSSH = execSSH;
exports.exists = exists;
exports.home = home;
exports.isDir = isDir;
exports.isFile = isFile;
exports.ls = ls;
exports.md5 = md5;
exports.mkdir = mkdir;
exports.mkdir_p = mkdir_p;
exports.mktemp = mktemp;
exports.pwd = pwd;
exports.realpath = realpath;
exports.removeSuffix = removeSuffix;
exports.rm = rm;
exports.rm_rf = rm_rf;
exports.runBash = runBash;
exports.sleep = sleep;
exports.spawn = spawn;
exports.spawnSSH = spawnSSH;
exports.spawnStd = spawnStd;
exports.spawnStdBash = spawnStdBash;
exports.stat = stat;
exports.touch = touch;
exports.unitMapping = void 0;
exports.wait = wait;
exports.withinTemp = withinTemp;
exports.write = write;
exports.writeMapping = writeMapping;
exports.write_f = write_f;
exports.writestderr = writestderr;
exports.writestdout = writestdout;

var _path = require("path");

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

// escape string
function esc(s) {
  let idx = s.indexOf("'");

  if (idx != -1) {
    s = s.replace("'", "'\\''"); // escape the ' with \'
  }

  return "'" + s + "'";
} // originally, escape is function for urlencode
// used to escape arguments


function escape(commands) {
  if (!commands || commands.length === 0) return "";

  if (commands.constructor === String) {
    return esc(commands);
  }

  let c = "";

  for (let command of commands) {
    c += esc(command) + " ";
  }

  return c.slice(0, c.length - 1); // remove last " "
}

function writestdout(data) {
  process.stdout.write(data);
}

function writestderr(data) {
  process.stderr.write(data);
} // trim suffix: "\n"


function chomp(s) {
  return s && s.endsWith("\n") ? s.slice(0, s.length - 1) : s;
}

function realpath(s) {
  return __awaiter(this, void 0, void 0, function* () {
    return yield exec(["realpath", s]);
  });
} // node file.js ..
// argv[0] = path to node
// argv[1] = file.js


let cmdDirResolved;

function cmdDir() {
  if (cmdDirResolved) {
    return cmdDirResolved;
  }

  let path = realpath(process.argv[1]);
  return cmdDirResolved = require("path").dirname(path);
} // relative to execFile


function cmdRel(path) {
  return require("path").join(cmdDir(), path);
}

function runBash(cmd, options) {
  return __awaiter(this, void 0, void 0, function* () {
    return yield spawnStdBash(cmd, options);
  });
} // spanwStdBash
// returns the command


function spawnStdBash(cmd, options) {
  return __awaiter(this, void 0, void 0, function* () {
    return yield spawnStd("bash", ["-ec", cmd], options);
  });
} // execute the cmd and connect them to stderr & stdout
// return the exit code


function spawnStd(cmd, args, options) {
  return __awaiter(this, void 0, void 0, function* () {
    // spawn("ls", ["-l","-h"])
    let c = child_process.spawn(cmd, args, options);
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    return yield new Promise(function (resolve, reject) {
      c.on("exit", code => {
        if (code === 0) {
          resolve(0);
          return;
        }

        reject(new Error(`exit: ${code}`));
      });
    });
  });
} // cmd can be a script
// design concern:
//    1. do not care exit code, only 0 and non-0 are distinguished
//    2. stdout is considered return value on success
//    3. stderr is considered exception message on error
//    4. no input, because ssh does not accept in such environment
// options:
//   setProcess(process)


function execSSH(sshHost, cmd, env, options) {
  return __awaiter(this, void 0, void 0, function* () {
    if (!sshHost) {
      throw new Error("requires sshHost");
    } // difference between exec and spawn:
    //    spawn gives you raw control on stdin,stdout,stderr, which means you must manage your buffer if you want to collect data
    //    exec provides a callback with stdout,stderr already buffered
    //   
    //    when write to stdout/stderr, spawn is more responsive(real time)
    //
    //    spawn accepts  binary,[args...], which is more suitable for command wrapping.
    //    exec accepts  a plain string, which is hard to escape correctly. But can be solved not beautifully by passing via env


    return new Promise(function (resolve, reject) {
      let process;
      process = child_process.exec('ssh "$EXEC_SSH_HOST" "$EXEC_SSH_CMD"', {
        encoding: 'utf-8',
        env: Object.assign(Object.assign({}, env), {
          EXEC_SSH_CMD: cmd,
          EXEC_SSH_HOST: sshHost
        })
      }, (err, stdout, stderr) => {
        const outStr = chomp((stdout === null || stdout === void 0 ? void 0 : stdout.toString('utf-8')) || "");

        if (err) {
          const errStr = chomp((stderr === null || stderr === void 0 ? void 0 : stderr.toString('utf-8')) || "");
          err.cmd = cmd;
          err.message = `ssh command failed(exit status not 0): ${cmd}, caused by ${err.message}, stdErr:${errStr}, stdout:${outStr}`;
          reject(err); // use resolve instead of reject, because we want it to be normal

          return;
        }

        resolve(outStr);
      });

      if (options === null || options === void 0 ? void 0 : options.setProcess) {
        options.setProcess(process);
      }
    });
  });
} // sshOptions?.ConnectTimeout


function spawnSSH(sshHost, cmd, sshOptions, options) {
  if (!sshHost) {
    throw new Error("requires sshHost");
  }

  if (!cmd) {
    throw new Error("requires cmd");
  }

  const sshArgs = []; // timeout in seconds

  if (sshOptions === null || sshOptions === void 0 ? void 0 : sshOptions.ConnectTimeout) {
    sshArgs.push("-o", `ConnectTimeout ${sshOptions.ConnectTimeout}`);
  }

  return child_process.spawn("ssh", [...sshArgs, sshHost, cmd], options);
} // cmd: executable binary or script
// args: array of args
// options
//     c.stdin.write(data);
//     c.stdin.end();


function spawn(cmd, args, options) {
  return __awaiter(this, void 0, void 0, function* () {
    const c = child_process.spawn(cmd, args, options);
    return new Promise(function (resolve, reject) {
      c.on('error', function (e) {
        reject(e);
      });
      c.on('close', function (code) {
        resolve({
          code
        });
      });
    });
  });
}

let unitMapping = {
  'd': 24 * 60 * 60 * 1000,
  'h': 60 * 60 * 1000,
  'm': 60 * 1000,
  's': 1000
}; // return Promise

exports.unitMapping = unitMapping;

function wait(n) {
  // number:ms
  // "1s", "2s", "2d"
  if (typeof n === 'string') {
    let last = n[n.length - 1];
    n = Number(n.slice(0, n.length - 1));
    let scale = unitMapping[last];

    if (scale) {
      n *= scale;
    }
  }

  return new Promise(resolve => setTimeout(resolve, n));
}

function sleep(n) {
  return new Promise(resolve => setTimeout(resolve, n));
}

function exec(cmd, options) {
  return __awaiter(this, void 0, void 0, function* () {
    let cmdStr = '';

    if (cmd instanceof Array) {
      cmdStr = escape(cmd);
    } else {
      cmdStr = cmd;
    } // stderr is output parent's stderr
    // stdout is returned as result
    //


    try {
      return new Promise((resolve, reject) => {
        const ps = child_process.exec(cmdStr, Object.assign({
          encoding: 'utf-8'
        }, options), (err, stdout, stderr) => {
          const outStr = chomp((stdout === null || stdout === void 0 ? void 0 : stdout.toString('utf-8')) || "");
          const errStr = chomp((stderr === null || stderr === void 0 ? void 0 : stderr.toString('utf-8')) || "");

          if (err) {
            err.cmd = cmdStr;
            err.message = `command failed(exit status not 0): ${cmdStr}, caused by ${err.message}, stdErr:${errStr}, stdout:${outStr}`;

            if (err.errcode === null || err.errcode === undefined) {
              err.errcode = 1;
            }

            resolve(err); // use resolve instead of reject, because we want it to be normal

            return;
          }

          resolve(outStr);
        });

        if (options === null || options === void 0 ? void 0 : options.input) {
          ps.stdin.write(options === null || options === void 0 ? void 0 : options.input);
          ps.stdin.end();
        }
      }); // sync version
      // let c = child_process.execSync(cmd, { encoding: 'utf-8', ...options })
      // return chomp(c)
    } catch (e) {
      // e.code will be the exit code
      // the caller should check
      // if(e.errcode){ /* handle the case*/}
      // let message = e.message
      e.cmd = cmd;
      e.message = `command failed(exit ${e.status}): ${cmd}`;
      e.errcode = e.status;
      return e;
    }
  });
}

function ls(dir) {
  return __awaiter(this, void 0, void 0, function* () {
    return fs.promises.readdir(dir || ".");
  });
}

function stat(path) {
  return __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
      fs.stat(path, (err, stat) => {
        if (err) {
          resolve(undefined);
        } else {
          resolve(stat);
        }
      });
    });
  });
}

function exists(path) {
  return __awaiter(this, void 0, void 0, function* () {
    return !!(yield stat(path));
  });
}

function cp(src, dest) {
  fs.copyFileSync(src, dest);
} // cp -rf src dst


function cp_rf(src, dest) {
  return __awaiter(this, void 0, void 0, function* () {
    // src can be array
    let cmd = yield exec(["cp", "-rf", ...(src instanceof Array ? src : [src]), dest]);

    if (cmd.errcode) {
      throw cmd;
    }
  });
}

function cat(f) {
  return __awaiter(this, void 0, void 0, function* () {
    // return string if encoding specified,otherwise buffer
    return yield fs.promises.readFile(f, {
      encoding: "utf-8"
    });
  });
}

function cat_silent(f) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      return yield cat(f);
    } catch (e) {// ignore
    }
  });
}

function cat_bin(f) {
  return __awaiter(this, void 0, void 0, function* () {
    return yield fs.promises.readFile(f);
  });
}

function write(f, content) {
  return __awaiter(this, void 0, void 0, function* () {
    return yield fs.promises.writeFile(f, content);
  });
}

function write_f(f, content) {
  return __awaiter(this, void 0, void 0, function* () {
    let dir = (0, _path.dirname)(f);

    if (!(yield isDir(dir))) {
      yield mkdir_p(dir);
    }

    yield write(f, content);
  });
}

function rm(f) {
  return __awaiter(this, void 0, void 0, function* () {
    if (fs.promises.rm) {
      // node 15
      yield fs.promises.rm(f); // fs.rmSync(f)
    } else {
      let cmd = yield exec(`rm ${escape(f)}`);

      if (cmd.errcode) {
        throw cmd;
      }
    }
  });
}

function rm_rf(f) {
  return __awaiter(this, void 0, void 0, function* () {
    if (fs.promises.rm) {
      // node 15
      yield fs.promises.rm(f, {
        force: true,
        recursive: true
      });
    } else {
      let cmd = yield exec(`rm -rf ${escape(f)}`);

      if (cmd.errcode) {
        throw cmd;
      }
    }
  });
}

function isFile(f) {
  return __awaiter(this, void 0, void 0, function* () {
    let fileStat = yield stat(f);
    return fileStat && fileStat.isFile();
  });
}

function isDir(d) {
  return __awaiter(this, void 0, void 0, function* () {
    let dirStat = yield stat(d);
    return dirStat && dirStat.isDirectory();
  });
}

function mkdir(path) {
  return __awaiter(this, void 0, void 0, function* () {
    yield fs.promises.mkdir(path, {
      recursive: false
    });
  });
}

function pwd() {
  return process.cwd();
}

function home() {
  return process.env["HOME"];
}

function mkdir_p(path) {
  return __awaiter(this, void 0, void 0, function* () {
    yield fs.promises.mkdir(path, {
      recursive: true
    });
  });
} // TODO: needs fix: when file does exist, don't overwrite


function touch(file) {
  return __awaiter(this, void 0, void 0, function* () {
    yield fs.promises.writeFile(file, "");
  });
}

function removeSuffix(name, suffix) {
  if (name && name.endsWith(suffix)) {
    return name.slice(0, name.length - suffix.length);
  }

  return name;
} // prefix is optional


function mktemp(prefix) {
  return __awaiter(this, void 0, void 0, function* () {
    return yield fs.promises.mkdtemp(prefix || "tmp-");
  });
} // within the temp directory
// [async] callback(dir)

/* async */


function withinTemp(prefix, callback) {
  return new Promise((resolve, reject) => {
    if (typeof prefix === 'function' && !callback) {
      callback = prefix;
      prefix = "";
    }

    if (!callback) {
      reject(new Error("requires callback"));
      return;
    }

    fs.mkdtemp(prefix || "tmp-", function (err, dir) {
      if (err) {
        reject(err);
        return;
      }

      ;
      (() => __awaiter(this, void 0, void 0, function* () {
        resolve(yield callback(dir));
      }))().catch(reject).finally(() => {
        rm_rf(dir);
      });
    });
  });
} // write content mapping, if a file is undefined,  it is deleted
// empty content will truncate the file


function writeMapping(dir, mapping) {
  return __awaiter(this, void 0, void 0, function* () {
    if (mapping) {
      for (let name in mapping) {
        let content = mapping[name];
        let fullpath = path.join(dir, name);

        if (content === undefined) {
          yield rm_rf(fullpath);
        } else if (content || content === '') {
          yield write_f(fullpath, content);
        }
      }
    }
  });
} // options:{
//    ref:false, // indicates if the system should wait while any watcher is running when exiting
// }


function deepwatch(dir, handler, options) {
  return __awaiter(this, void 0, void 0, function* () {
    const {
      ref
    } = options || {};
    const dirExists = yield exists(dir);

    if (!dirExists) {
      // fallback: use watchFile to watch non-existent file
      const watcher = fs.watchFile(dir, (cur, prev) => {
        console.log("");
      });

      if (!ref) {
        watcher.unref();
      }
    }

    if (!(yield exists(dir))) {} // if (fs.promises.)

  });
}

function error(msg) {
  console.error(msg);
  process.exit(1);
}

function md5(s) {
  if (!s) {
    return '';
  }

  return crypto.createHash('md5').update(s).digest('hex');
}