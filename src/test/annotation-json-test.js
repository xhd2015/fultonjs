import { stringify, ANNOTATION } from "../annotation-json"
import { runTests, expectEquals } from "../test-util"

async function test() {
    runTests({
        testNoAnnotation,
        testAnnotation,
        testCustomAnnotationKey,
    })
}

async function testNoAnnotation() {
    const obj = { a: 10, b: 20, c: false, d: new Date(1641644664990), e: null, f: undefined }
    const basicValues = stringify(obj)
    expectEquals({ basicValues, value: '{"a":10,"b":20,"c":false,"d":"2022-01-08T12:24:24.990Z","e":null}' })

    const basicValuesPretty = stringify(obj, { pretty: true })
    const prettyExpect=`{
    "a":10,
    "b":20,
    "c":false,
    "d":"2022-01-08T12:24:24.990Z",
    "e":null
}`
    expectEquals({ basicValuesPretty,prettyExpect})
}


async function testAnnotation() {
    const obj = {
        a: 10,
        b: "20",
        c: false,
        d: {
            x: "en"
        },
        f: [1, 2, 3],
        g: [{ x: "z", m: "j" }]
    }
    const annotation = {
        [ANNOTATION]: "this is root comment",
        a: {
            [ANNOTATION]: "this is a"
        },
        b: {
            [ANNOTATION]: "this is b"
        },
        d: {
            [ANNOTATION]: "this is for object d"
        },
        f: [{ [ANNOTATION]: "this is f.0" }],
        g: [
            {
                x: {
                    [ANNOTATION]: "this is just for g.0.x"
                },
                m: {
                    [ANNOTATION]: "this is just for g.0.m"
                },
            }
        ]
    }
    const noPrettyValue = stringify(obj, {
        annotation,
        pretty: false,
    })
    const expectNoPrettyValue = '{ /* this is root comment */ "a":10, /* this is a */"b":"20", /* this is b */"c":false,"d":{ /* this is for object d */ "x":"en"},"f":[1, /* this is f.0 */2,3],"g":[{"x":"z", /* this is just for g.0.x */"m":"j" /* this is just for g.0.m */}]}'
    expectEquals({ noPrettyValue, expectNoPrettyValue })

    const objStringify = JSON.stringify(obj)
    const noPrettyEval = JSON.stringify(eval('(' + noPrettyValue + ')'))
    expectEquals({ noPrettyEval, objStringify })

    const prettyValue = stringify(obj, {
        annotation,
        pretty: true,
    })
    const expectPrettyValue = `{// this is root comment
    "a":10, // this is a
    "b":"20", // this is b
    "c":false,
    "d":{// this is for object d
        "x":"en"
    },
    "f":[
        1, // this is f.0
        2,
        3
    ],
    "g":[
        {
            "x":"z", // this is just for g.0.x
            "m":"j" // this is just for g.0.m
        }
    ]
}`
    expectEquals({ prettyValue, expectPrettyValue })
    const prettyEval = JSON.stringify(eval('(' + noPrettyValue + ')'))
    expectEquals({ prettyEval, objStringify })
}

async function testCustomAnnotationKey() {
    const obj = {
        a: 10
    }
    const annotation = {
        "$$comment":"for root",
        "a":{
            "$$comment":"for a"
        }
    }
    const value = stringify(obj,{annotationKey:"$$comment", annotation})
    expectEquals({value, a:'{ /* for root */ "a":10 /* for a */}'})
}

test()