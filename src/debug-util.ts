export function makeDebug(debug: boolean): (...args: any[]) => void {
    return function (...args: any[]): void {
        {
            if (!debug) {
                return;
            }
            console.log("DEBUG ", ...args);
        }
    }
}