
import { fromFileName, walkServices } from "../proto";
import { Mocker, mockScalarMore, ANNOTATION } from "../mock"
import * as path from "path"
import { stringify } from "annotation-json"

async function test() {
    const file = path.join(__dirname, "../../../test/test-enum.proto")
    const proto = await fromFileName(file)

    const mocker = new Mocker()
    walkServices(proto, (service, def, name) => {
        console.log("on service:", name)

        const methodsMock = mocker.mockRequestMethods(service)
        const method0 = Object.keys(methodsMock)[0]
        if (method0) {
            const res = methodsMock[method0]()
            console.log("mock method0:", method0, res.plain, res.annotation)

            const mockStr = stringify(res.plain, {
                annotation: res.annotation,
                annotationKey: ANNOTATION,
                pretty: true,
            })
            console.log("mock str:", mockStr)
        }
    })
}

async function testSmoke() {
    const file = "/Users/xiaohuadong/Projects/gopath/src/git.garena.com/shopee/loan-service/credit_backend/public/protobuf/protobuf3/credit_pay_v2.proto"
    const proto = await fromFileName(file)
    // console.log("proto:", proto)

    walkServices(proto, (service, def, name) => {
        console.log("on service:", name)

        const mocker = new Mocker({
            mockScalar: (type) => mockScalarMore(type, "")
        })

        const methodsMock = mocker.mockRequestMethods(service)
        const method0 = Object.keys(methodsMock)[0]
        if (method0) {
            console.log("mock method0:", method0, methodsMock[method0]().plain)
        }
    })
}

test()