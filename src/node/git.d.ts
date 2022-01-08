export class GitRepo {
    constructor(root: any, repo: any, limit?: number);
    root: any;
    repo: any;
    limit: number;
    withinBranch(branch: any, callback: any): Promise<any>;
    useBranch(branch: any): Promise<any>;
    _createDir(branch: any): Promise<{
        dir: any;
        close: () => Promise<void>;
    }>;
}
