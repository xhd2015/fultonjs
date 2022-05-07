import * as code from "../code";

async function test() {
    // testAnnotation()
    // testFormatCode()
    testFormatExpr()
}

async function testAnnotation() {
    const c = `{a:10,b:"30",c:false,d:{x:"en"}}`
    const a = code.transferCode(c, {
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

async function testFormatCode() {
    const c = `({a:10,b:"30" /*this is b*/,c:false,d:{x:"en"}})`
    const a = code.formatCode(c)
    console.log("formated code:", a)
}
async function testFormatExpr() {
    const c = `{a:10,b:"30" /*this is b*/,c:false,d:{x:"en"}}`
    const a = code.formatExpr(c)
    console.log("formated expr:", a)
}

test()