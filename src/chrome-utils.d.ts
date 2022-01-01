export function hideSelector(selector: any): boolean;
export function hide(el: any): boolean;
export function querySelectorAll(...queries: any[]): any;
export function querySelector(...queries: any[]): any;
export function querySelectorAllOn(el: any, ...queries: any[]): any;
export function querySelectorOn(el: any, ...queries: any[]): any;
export function nothing(): void;
export function sleep(n: any): Promise<any>;
export function until(fn: any, limit: any, interval?: number): Promise<any>;
export class TimerTask {
    constructor(interval: any, limit: any, action: any, taskName: any);
    limit: any;
    interval: any;
    taskID: NodeJS.Timeout;
    action: any;
    taskName: any;
    finished: boolean;
    start(): TimerTask;
    _clearTask(): boolean;
    stop(): boolean;
}
