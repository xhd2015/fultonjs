// provide basic shell capabilities
import * as fs from "fs"
import * as path from "path"
import * as child_process from "child_process"
import { dirname } from "path"
import * as crypto from 'crypto'

// escape string
export function esc(s) {
	let idx = s.indexOf("'")
	if (idx != -1) {
		s = s.replaceAll("'", "'\\''") // escape the ' with \'
	}
	return "'" + s + "'"
}

// originally, escape is function for urlencode
// used to escape arguments
export function escape(commands) {
	if (!commands || commands.length === 0) return ""
	if (commands.constructor === String) {
		return esc(commands)
	}
	let c = ""
	for (let command of commands) {
		c += esc(command) + " "
	}
	return c.slice(0, c.length - 1) // remove last " "
}

export function writestdout(data) {
	process.stdout.write(data)
}
export function writestderr(data) {
	process.stderr.write(data)
}
// trim suffix: "\n"
export function chomp(s) {
	return (s && s.endsWith("\n")) ? s.slice(0, s.length - 1) : s
}
export async function realpath(s) {
	return await exec(["realpath", s])
}

// node file.js ..
// argv[0] = path to node
// argv[1] = file.js
let cmdDirResolved
export function cmdDir() {
	if (cmdDirResolved) {
		return cmdDirResolved
	}
	let path = realpath(process.argv[1])
	return cmdDirResolved = require("path").dirname(path)
}

// relative to execFile
export function cmdRel(path) {
	return require("path").join(cmdDir(), path)
}
export async function runBash(cmd, options) {
	return await spawnStdBash(cmd, options)
}
// spanwStdBash
// returns the command
export async function spawnStdBash(cmd, options) {
	return await spawnStd("bash", ["-ec", cmd], options)
}
// execute the cmd and connect them to stderr & stdout
// return the exit code
export async function spawnStd(cmd, args, options) {
	// spawn("ls", ["-l","-h"])
	let c = child_process.spawn(cmd, args, options)
	c.stdout.pipe(process.stdout)
	c.stderr.pipe(process.stderr)

	return await new Promise(function (resolve, reject) {
		c.on("exit", (code) => {
			if (code === 0) {
				resolve(0);
				return;
			}
			reject(new Error(`exit: ${code}`));
		});

	})
}

// cmd can be a script
// design concern:
//    1. do not care exit code, only 0 and non-0 are distinguished
//    2. stdout is considered return value on success
//    3. stderr is considered exception message on error
//    4. no input, because ssh does not accept in such environment
// options:
//   setProcess(process)
export async function execSSH(sshHost, cmd, env, options) {
	if (!sshHost) {
		throw new Error("requires sshHost")
	}
	// difference between exec and spawn:
	//    spawn gives you raw control on stdin,stdout,stderr, which means you must manage your buffer if you want to collect data
	//    exec provides a callback with stdout,stderr already buffered
	//   
	//    when write to stdout/stderr, spawn is more responsive(real time)
	//
	//    spawn accepts  binary,[args...], which is more suitable for command wrapping.
	//    exec accepts  a plain string, which is hard to escape correctly. But can be solved not beautifully by passing via env
	return new Promise(function (resolve, reject) {
		let process
		process = child_process.exec('ssh "$EXEC_SSH_HOST" "$EXEC_SSH_CMD"', { encoding: 'utf-8', env: { ...env, EXEC_SSH_CMD: cmd, EXEC_SSH_HOST: sshHost } }, (err, stdout, stderr) => {
			const outStr = chomp(stdout?.toString('utf-8') || "")
			if (err) {
				const errStr = chomp(stderr?.toString('utf-8') || "")
				err.cmd = cmd
				err.message = `ssh command failed(exit status not 0): ${cmd}, caused by ${err.message}, stdErr:${errStr}, stdout:${outStr}`
				reject(err) // use resolve instead of reject, because we want it to be normal
				return
			}
			resolve(outStr)
		});
		if (options?.setProcess) {
			options.setProcess(process);
		}

	})
}

// sshOptions?.ConnectTimeout
export function spawnSSH(sshHost, cmd, sshOptions, options) {
	if (!sshHost) {
		throw new Error("requires sshHost")
	}
	if (!cmd) {
		throw new Error("requires cmd")
	}
	const sshArgs = []
	// timeout in seconds
	if (sshOptions?.ConnectTimeout) {
		sshArgs.push("-o", `ConnectTimeout ${sshOptions.ConnectTimeout}`)
	}
	return child_process.spawn("ssh", [...sshArgs, sshHost, cmd], options)
}

// cmd: executable binary or script
// args: array of args
// options
//     c.stdin.write(data);
//     c.stdin.end();
export async function spawn(cmd, args, options,) {
	const c = child_process.spawn(cmd, args, options)
	return new Promise(function (resolve, reject) {
		c.on('error', function (e) {
			reject(e)
		})
		c.on('close', function (code) {
			resolve({ code })
		})
	})
}

export let unitMapping = {
	'd': 24 * 60 * 60 * 1000,
	'h': 60 * 60 * 1000,
	'm': 60 * 1000,
	's': 1000,
}
// return Promise
export function wait(n) {
	// number:ms
	// "1s", "2s", "2d"
	if (typeof n === 'string') {
		let last = n[n.length - 1]
		n = Number(n.slice(0, n.length - 1))
		let scale = unitMapping[last]
		if (scale) {
			n *= scale
		}
	}
	return new Promise(resolve => setTimeout(resolve, n))
}
export function sleep(n) {
	return new Promise(resolve => setTimeout(resolve, n))
}

// cmd: accepts array(each of which will be escaped)
//      or a string, which is passed to the shell directly, without quote
// options is passed to child_process.exec directly
//   options.env: {K:V}
//   options.cwd:  working director
// example: 
//   await exec(['bash','-c',''])
// returns: output string, or if error {errcode,cmd,message}
// you can check if(res.errcode){ /* handle error */}
export interface ExecOptions {
	input?: string
}
export async function exec(cmd: string | string[], options?: ExecOptions) {
	let cmdStr: string = ''
	if (cmd instanceof Array) {
		cmdStr = escape(cmd)
	} else {
		cmdStr = cmd as string
	}
	// stderr is output parent's stderr
	// stdout is returned as result
	//
	try {
		return new Promise((resolve, reject) => {
			const ps = child_process.exec(cmdStr, { encoding: 'utf-8', ...options }, (err, stdout, stderr) => {
				const outStr = chomp(stdout?.toString('utf-8') || "")
				const errStr = chomp(stderr?.toString('utf-8') || "")
				if (err) {
					err.cmd = cmdStr
					err.message = `command failed(exit status not 0): ${cmdStr}, caused by ${err.message}, stdErr:${errStr}, stdout:${outStr}`
					if (err.errcode === null || err.errcode === undefined) {
						err.errcode = 1
					}
					resolve(err) // use resolve instead of reject, because we want it to be normal
					return
				}
				resolve(outStr)
			})
			if (options?.input) {
				ps.stdin.write(options?.input)
				ps.stdin.end()
			}
		})
		// sync version
		// let c = child_process.execSync(cmd, { encoding: 'utf-8', ...options })
		// return chomp(c)
	} catch (e) {
		// e.code will be the exit code
		// the caller should check
		// if(e.errcode){ /* handle the case*/}
		// let message = e.message
		e.cmd = cmd
		e.message = `command failed(exit ${e.status}): ${cmd}`
		e.errcode = e.status
		return e
	}
}

export async function ls(dir) {
	return fs.promises.readdir(dir || ".")
}

export async function stat(path) {
	return new Promise((resolve, reject) => {
		fs.stat(path, (err, stat) => {
			if (err) {
				resolve(undefined)
			} else {
				resolve(stat)
			}
		})
	})
}
export async function exists(path) {
	return !!(await stat(path))
}

export function cp(src, dest) {
	fs.copyFileSync(src, dest)
}
// cp -rf src dst
export async function cp_rf(src, dest) {
	// src can be array
	let cmd = await exec(["cp", "-rf", ...(src instanceof Array ? src : [src]), dest])
	if (cmd.errcode) {
		throw cmd
	}
}
export async function cat(f) {
	// return string if encoding specified,otherwise buffer
	return await fs.promises.readFile(f, { encoding: "utf-8" })
}
export async function cat_silent(f) {
	try {
		return await cat(f)
	} catch (e) {
		// ignore
	}
}
export async function cat_bin(f) {
	return await fs.promises.readFile(f)
}
export async function write(f, content) {
	return await fs.promises.writeFile(f, content)
}
export async function write_f(f, content) {
	let dir = dirname(f)
	if (!await isDir(dir)) {
		await mkdir_p(dir)
	}
	await write(f, content)
}
export async function rm(f) {
	if (fs.promises.rm) { // node 15
		await fs.promises.rm(f)
		// fs.rmSync(f)
	} else {
		let cmd = await exec(`rm ${escape(f)}`)
		if (cmd.errcode) {
			throw cmd
		}
	}
}
export async function rm_rf(f) {
	if (fs.promises.rm) { // node 15
		await fs.promises.rm(f, { force: true, recursive: true })
	} else {
		let cmd = await exec(`rm -rf ${escape(f)}`)
		if (cmd.errcode) {
			throw cmd
		}
	}
}

export async function isFile(f) {
	let fileStat = await stat(f)
	return fileStat && fileStat.isFile()
}
export async function isDir(d) {
	let dirStat = await stat(d)
	return dirStat && dirStat.isDirectory()
}
export async function mkdir(path) {
	await fs.promises.mkdir(path, { recursive: false })
}
export function pwd(): string {
	return process.cwd()
}
export function home(): string {
	return process.env["HOME"]
}
export async function mkdir_p(path) {
	await fs.promises.mkdir(path, { recursive: true })
}
// TODO: needs fix: when file does exist, don't overwrite
export async function touch(file) {
	await fs.promises.writeFile(file, "")
}
export function removeSuffix(name, suffix) {
	if (name && name.endsWith(suffix)) {
		return name.slice(0, name.length - suffix.length)
	}
	return name
}

// prefix is optional
export async function mktemp(prefix) {
	return await fs.promises.mkdtemp(prefix || "tmp-")
}

// within the temp directory
// [async] callback(dir)
/* async */
export function withinTemp(prefix, callback) {
	return new Promise((resolve, reject) => {
		if (typeof prefix === 'function' && !callback) {
			callback = prefix
			prefix = ""
		}
		if (!callback) {
			reject(new Error("requires callback"))
			return
		}
		fs.mkdtemp(prefix || "tmp-", function (err, dir) {
			if (err) {
				reject(err)
				return
			}
			; (async () => {
				resolve(await callback(dir))
			})().catch(reject)
				.finally(() => {
					rm_rf(dir)
				})
		})
	})
}

// write content mapping, if a file is undefined,  it is deleted
// empty content will truncate the file
export async function writeMapping(dir, mapping) {
	if (mapping) {
		for (let name in mapping) {
			let content = mapping[name]
			let fullpath = path.join(dir, name)
			if (content === undefined) {
				await rm_rf(fullpath)
			} else if (content || content === '') {
				await write_f(fullpath, content)
			}
		}
	}
}

// options:{
//    ref:false, // indicates if the system should wait while any watcher is running when exiting
// }
export async function deepwatch(dir, handler, options) {
	const { ref } = options || {}
	const dirExists = await exists(dir)
	if (!dirExists) {
		// fallback: use watchFile to watch non-existent file
		const watcher = fs.watchFile(dir, (cur, prev) => {
			console.log("")
		})
		if (!ref) {
			watcher.unref()
		}
	}

	if (!await exists(dir)) {

	}
	// if (fs.promises.)
}

export function error(msg) {
	console.error(msg)
	process.exit(1)
}

export function md5(s) {
	if (!s) {
		return ''
	}
	return crypto.createHash('md5').update(s).digest('hex');
}
