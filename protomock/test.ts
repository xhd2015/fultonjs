import { fromFileName, walkServices } from "./proto";
import {Mocker, mockScalarMore} from "./mock"

async function run() {
    const file = "/Users/xiaohuadong/Projects/gopath/src/git.garena.com/shopee/loan-service/credit_backend/public/protobuf/protobuf3/credit_pay_v2.proto"
    const proto = await fromFileName(file)
    // console.log("proto:", proto)

    walkServices(proto, (service, def, name) => {
        console.log("on service:", name)

        const mocker = new Mocker({
            mockScalar:(type) => mockScalarMore(type,"")
        })

       const methodsMock =  mocker.mockRequestMethods(service)
       const method0 = Object.keys(methodsMock)[0]
       if(method0){
           console.log("mock method0:", method0, methodsMock[method0]().plain)
       }
    })
}

run()