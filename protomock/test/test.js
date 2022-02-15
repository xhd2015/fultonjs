var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fromFileName, walkServices } from "../proto";
import { Mocker, mockScalarMore, ANNOTATION } from "../mock";
import * as path from "path";
import { stringify } from "../../src/annotation-json";
function test() {
    return __awaiter(this, void 0, void 0, function* () {
        const file = path.join(__dirname, "../../../test/test-enum.proto");
        const proto = yield fromFileName(file);
        const mocker = new Mocker();
        walkServices(proto, (service, def, name) => {
            console.log("on service:", name);
            const methodsMock = mocker.mockRequestMethods(service);
            const method0 = Object.keys(methodsMock)[0];
            if (method0) {
                const res = methodsMock[method0]();
                console.log("mock method0:", method0, res.plain, res.annotation);
                const mockStr = stringify(res.plain, {
                    annotation: res.annotation,
                    annotationKey: ANNOTATION,
                    pretty: true,
                });
                console.log("mock str:", mockStr);
            }
        });
    });
}
function testSmoke() {
    return __awaiter(this, void 0, void 0, function* () {
        const file = "/Users/xiaohuadong/Projects/gopath/src/git.garena.com/shopee/loan-service/credit_backend/public/protobuf/protobuf3/credit_pay_v2.proto";
        const proto = yield fromFileName(file);
        // console.log("proto:", proto)
        walkServices(proto, (service, def, name) => {
            console.log("on service:", name);
            const mocker = new Mocker({
                mockScalar: (type) => mockScalarMore(type, "")
            });
            const methodsMock = mocker.mockRequestMethods(service);
            const method0 = Object.keys(methodsMock)[0];
            if (method0) {
                console.log("mock method0:", method0, methodsMock[method0]().plain);
            }
        });
    });
}
test();
