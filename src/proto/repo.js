
// TODO: complete this file
async function listService(repo, branch, files) {
    const serviceMapping = {}

    if (!Array.isArray(files)) {
        files = [files]
    }

    const grpcMocker = new mocker.Mocker({
        annotationKey
    })
    const grpcDefs = await getGRPCDefs(repo, branch, files);
    grpcDefs?.forEach(grpcDef => {
        protoMock.walkServices(grpcDef, (service, def, serviceName) => {
            const methodMapping = {}
            const methodsMock = grpcMocker.mockRequestMethods(service)
            Object.keys(methodsMock).forEach(method => {
                try {
                    grpcMocker.reset()
                    const { plain: data, annotation } = methodsMock[method]()
                    const reqAnnotation = deepmerge(annotation, getServiceMethodRequestAnnotation(serviceName, method))
                    const requestExample = stringify(data, {
                        annotationKey,
                        annotation: reqAnnotation,
                        pretty: true,
                    })
                    methodMapping[method] = { request: requestExample }
                } catch (e) {
                    methodMapping[method] = { request: { "error": e.message } }
                }
            })
            serviceMapping[serviceName] = methodMapping
        })
    })
    return serviceMapping
}

// returns {ast}
async function getGRPCDefs(repo, branch, files) {
    const subRepos = []
    const subIncludes = {}
    for (let dep of (dependsRepo[repo] || [])) {
        subRepos.push(dep.source)
        subIncludes[dep.source] = dep.includes
    }

    const grpcDefs = []
    await doWithRepos(repo, branch, subRepos, async (dir, subDirs) => {
        const includes = protoSourceOptions[repo]?.includes?.map?.(e => path.join(dir, e))
        for (let subRepo in subDirs) {
            const subDir = subDirs[subRepo]
            subIncludes[subRepo]?.forEach(e => {
                includes.push(path.join(subDir, e))
            })
        }
        for (let file of files) {
            const entryFile = path.join(dir, file)
            const grpcDef = await protoMock.fromFileName(entryFile, includes)
            grpcDefs.push(grpcDef)
        }
    })
    return grpcDefs
}

async function doWithRepo(repo, branch, callback) {
    const md5 = shell.md5(repo);
    const gitRepo = new git.GitRepo(`/tmp/grpc-repo/${md5}`, repo);

    await gitRepo.withinBranch(branch, async (dir, branch) => {
        await callback(dir)
    })
}

// callback(primaryDir, subDirs:{...})
async function doWithRepos(primaryRepo, branch, subRepos, callback) {
    const deferCloses = []
    try {
        const md5 = shell.md5(primaryRepo);
        const gitRepo = new git.GitRepo(`/tmp/grpc-repo/${md5}`, primaryRepo);

        const subDirs = {}
        const { dir: primaryDir, close: primaryClose } = await gitRepo.useBranch(branch)
        deferCloses.push(primaryClose)
        for (let subRepo of subRepos) {
            const md5 = shell.md5(subRepo);
            const subGitRepo = new git.GitRepo(`/tmp/grpc-repo/${md5}`, subRepo);
            // no branch specified, cannot apply these branch
            const { dir: subDir, close: subClose } = await subGitRepo.useBranch('master')
            subDirs[subRepo] = subDir
            deferCloses.push(subClose)
        }
        await Promise.resolve(callback(primaryDir, subDirs))
    } finally {
        for (let close of deferCloses) {
            await close().catch(e => e) // do not throw error, just let me close all silently
        }
    }
}