import { indexedSum, get2DFeature } from "../string-similarity"


function testIndexedSum(){
    let strings = ["aaabbccccdssdf", "aabbeassdsf","adsfew"]
    let sums = strings.map(e => indexedSum(e))

    console.log(sums)
}

testIndexedSum()