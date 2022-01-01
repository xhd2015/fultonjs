export function genlog(psmList: any, options: any): Promise<any>;
export function genlogStat(psmList: any, options: any): Promise<{
    logs: {};
    count: number;
}>;
export function defaultDiagnoseMapGetter(psmList: any): (psm: any, log: any) => any;
export function renderStatToHTML(logStat: any, options: any): string;
export const levelMap: {
    4: string;
    5: string;
};
export namespace levelStrMap {
    const Unknown: number;
    const Debug: number;
    const Notice: number;
    const Info: number;
    const Warn: number;
    const Error: number;
}
export class LogFetcher {
    constructor(client: any);
    client: any;
    genlog(psmList: any, options: any): Promise<any>;
    genlogStat(psmList: any, options: any): Promise<{
        logs: {};
        count: number;
    }>;
}
