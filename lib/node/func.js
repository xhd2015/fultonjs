function isAsyncFuntion(f) {
    if (f === undefined) return false
    return Object.getPrototypeOf(async function () { }) === Object.getPrototypeOf(f)
}

// async function callPossibleAsync(f,...args){
//     if(isAsyncFuntion(f)){
//         return await f.call
//     }else{
//         return await f.call(...args)
//     }
// }


module.exports = {
    isAsyncFuntion,
    // invokePossibleAsync
}