import { tryExtractByStartingFromKV, tryExtractAllWithDetail } from "./guess";
import { guess } from "./parser";
import * as  testUtils  from "../test-util"

function test() {
    testUtils.runTests({
        // testTryParseWithPrefix,
        // testTryParseWithPrefixLog1,
        // testTryExtractByStartingFromKV,
        testGuessReq,
    })
}
async function testTryParseWithPrefix(){
    const s = await testUtils.readFile(__dirname,"testdata/log2.txt")

    const obj = tryExtractAllWithDetail(s,{
        lookingPrefix:[{prefix:'respBody: ',autoObjectBrace:true}]
    })
    const object = JSON.stringify(obj?.[0]?.object)
    testUtils.expectEquals({object,expect:'{"infos":{"credit_user_id":1550333503592206300,"loan_id":"2021102180697961550333503592206336000101634825969412","confirm_time":1634825971}}'})
}
async function testTryParseWithPrefixLog1(){
    const s = await testUtils.readFile(__dirname,"testdata/log1.txt")

    const obj = tryExtractAllWithDetail(s,{
        lookingPrefix:[{prefix:'Response: ',autoObjectBrace:true}]
    })
    const object = JSON.stringify(obj?.[0]?.object)
    testUtils.expectEquals({object,expect:'{"infos":{"credit_user_id":1550333503592206300,"loan_id":"2021102180697961550333503592206336000101634825969412","confirm_time":1634825971}}'})
}


async function testTryExtractByStartingFromKV(){
    const s = await testUtils.readFile(__dirname,"testdata/log2.txt")
    tryExtractByStartingFromKV(s)
}
async function testGuessReq(){
    const s = await testUtils.readFile(__dirname,"testdata/req-0.txt")
    const objects = guess(s)
    console.log(objects)
}
test()