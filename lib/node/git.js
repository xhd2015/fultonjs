const fs = require("fs")
const fsPromises = require("fs/promises")
const path = require("path")
const shell = require("./shell")

// manage a shared repo
class GitRepo {
	constructor(root, repo, limit = 10) {
		if (!root) {
			throw new Error("requires root")
		}
		if (!repo) {
			throw new Error("requires repo")
		}
		this.root = root
		this.repo = repo
		this.limit = limit
	}
	// async initRoot(){
	// 	await fsPromises
	// 	fsPromises.exists()
	// 	if (!fs.existsSync(root)) {
	// 		throw new Error("root does not exist:" + root)
	// 	}
	// }

	// callback:  function(dir,branch){ .... }
	// called  when the branch is prepared
	async withinBranch(branch, callback) {
		let doClose
		try {
			const { dir, close } = await this.useBranch(branch)
			doClose = close
			return await Promise.resolve(callback(dir, branch))
		} finally {
			if (doClose) {
				await doClose()
			}
		}
	}

	// returns Promise<{dir,close}>
	// must call clsoe
	async useBranch(branch) {
		return new Promise((resolve, reject) => {
			this._createDir(branch).then(resolve).catch(reject)
		})
	}

	async _createDir(branch) {
		if (!branch) {
			branch = "master"
		}
		const limit = 10
		for (let i = 0; i < limit; i++) {
			// ensure root exists
			await fsPromises.mkdir(this.root, { recursive: true })
			const files = await shell.ls(this.root)
			// every $dir under root has a $dir.lock file
			// every dir has a repo_ as prefix, pattern: repo_${i}
			let fileSet = new Set(files)
			let repoCount = 0
			let freeRepo
			for (let file of files) {
				if (file.startsWith("repo_") && !file.endsWith(".lock") &&
					!await shell.exists(path.join(this.root, file, ".git", "index.lock"))) {
					repoCount++
					if (!fileSet.has(file + ".lock")) {
						freeRepo = file
						break
					}
				}
			}

			let e = shell.escape
			let dir
			let newRepo = false
			if (!freeRepo) {
				if (this.limit > 0 && repoCount > this.limit) {
					throw new Error("repository busy, please try again later.")
					return
				}
				// generate random directory
				dir = await shell.mktemp(path.join(this.root, "repo_"))
				newRepo = true
			} else {
				dir = path.join(this.root, freeRepo)
				// if .git dir does not exist
				// then it is a new repository
				if (!await shell.exists(path.join(dir, ".git"))) {
					await shell.exec(`rm -rf ${e(dir)} && mkdir -p ${e(dir)}`)
					newRepo = true
				} else {
					// rm -rf previouse .git/index.lock
					// await shell.exec(`rm -rf ${e(dir)}/.git/index.lock`)
				}
			}
			let dirLock = dir + ".lock"
			const gitIndexLock = path.join(dir, ".git", "index.lock")
			try {
				await shell.mkdir(dirLock); // may fail

				if (await shell.exists(gitIndexLock)) {
					await shell.rm_rf(dirLock)
					throw new Error(".git/index.lock detected after locking")
				}
			} catch (e) {
				if (i >= limit - 1) {
					throw e
				}
				console.log("try next:", i, e)
				// sleep 100ms
				await shell.sleep(100)
				// try next
				continue
			}


			let cmd
			if (newRepo) {
				cmd = await shell.exec(`git clone --branch ${e(branch)} ${e(this.repo)} ${e(dir)}`)
			} else {
				// git clean:https://coderwall.com/p/g16jpq/keep-your-git-directory-clean-with-git-clean-and-git-trash
				// use git status to test first.in some cases the repo remains at an incosistent status
				cmd = await shell.exec(`repodir=${e(dir)};set -e;cd "$repodir"; if ! git status &>/dev/null;then cd ..;rm -rf "$repodir";git clone --branch ${e(branch)} ${e(this.repo)} "$repodir";cd "$repodir";fi;git clean -x -f -d --quiet; git reset --hard ;git checkout ${e(branch)} ;git pull origin ${e(branch)}`)
			}
			if (cmd instanceof Error) {
				throw cmd
				//reject(cmd)// cmd is error
				// return
			}
			let closed = false
			return {
				dir,
				close: async () => {
					if (!closed) {
						closed = true
						await shell.rm_rf(dirLock)
						await shell.rm_rf(path.join(dir, ".git", "index.lock"))
					}
				}
			}
		}
	}
}

module.exports = {
	GitRepo,
}
