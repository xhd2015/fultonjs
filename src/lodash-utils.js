import lodash from "lodash"

//   debounce(this.updateParsedLog,200)(this.log)
const debounceMem = {}
export function debounce(fn,n){
    const memFn = debounceMem[fn]
    if(memFn){
        return memFn
    }
    return debounceMem[fn] = lodash.debounce(fn,n)
}