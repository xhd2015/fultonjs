import { transferCode, ANNOTATION } from "../code";

async function test() {
    testAnnotation()
}

async function testAnnotation() {
    const code = `{a:10,b:"30",c:false,d:{x:"en"}}`
    const a = transferCode(code, {
        object: true,
        format: true,
        debug: true,
        annotation: {
            [ANNOTATION]: "// what is the fuck",
            a: {
                [ANNOTATION]: "// this is a"
            },
            b: {
                [ANNOTATION]: "// this is b"
            }
        }
    })

    console.log("transfered code:", a)
}

test()