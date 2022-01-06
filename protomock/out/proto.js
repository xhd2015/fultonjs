"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceByName = exports.walkNamespace = exports.walkServices = exports.fromFileName = void 0;
var fs = require("fs");
var grpc_js_1 = require("@grpc/grpc-js");
var get = require("lodash/get");
var path = require("path");
var protobufjs_1 = require("protobufjs");
var proto_loader_1 = require("@grpc/proto-loader");
/**
 * Proto ast from filename
 */
function fromFileName(protoPath, includeDirs) {
    return __awaiter(this, void 0, void 0, function () {
        var packageDefinition, protoAST, protoRoot, root, protoText;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    includeDirs = includeDirs ? __spreadArray([], includeDirs, true) : [];
                    if (path.isAbsolute(protoPath)) {
                        includeDirs.push(path.dirname(protoPath));
                    }
                    else {
                        includeDirs.push(path.dirname(path.join(process.cwd(), protoPath)));
                    }
                    return [4 /*yield*/, (0, proto_loader_1.load)(path.basename(protoPath), {
                            keepCase: true,
                            longs: String,
                            enums: String,
                            defaults: true,
                            oneofs: true,
                            includeDirs: includeDirs,
                        })];
                case 1:
                    packageDefinition = _a.sent();
                    protoAST = (0, grpc_js_1.loadPackageDefinition)(packageDefinition);
                    protoRoot = new protobufjs_1.Root();
                    if (includeDirs) {
                        addIncludePathToRoot(protoRoot, includeDirs);
                    }
                    return [4 /*yield*/, protoRoot.load(protoPath, {
                            keepCase: true,
                        })];
                case 2:
                    root = _a.sent();
                    return [4 /*yield*/, promisifyRead(protoPath)];
                case 3:
                    protoText = _a.sent();
                    return [2 /*return*/, {
                            fileName: protoPath.split(path.sep).pop() || '',
                            filePath: protoPath,
                            protoText: protoText,
                            ast: protoAST,
                            root: root,
                        }];
            }
        });
    });
}
exports.fromFileName = fromFileName;
/**
 * Walk through services
 */
function walkServices(proto, onService) {
    var ast = proto.ast, root = proto.root;
    walkNamespace(root, function (namespace) {
        var nestedNamespaceTypes = namespace.nested;
        if (nestedNamespaceTypes) {
            Object.keys(nestedNamespaceTypes).forEach(function (nestedTypeName) {
                var fullNamespaceName = (namespace.fullName.startsWith('.'))
                    ? namespace.fullName.replace('.', '')
                    : namespace.fullName;
                var nestedType = root.lookup("".concat(fullNamespaceName, ".").concat(nestedTypeName));
                if (nestedType instanceof protobufjs_1.Service) {
                    var serviceName = __spreadArray(__spreadArray([], fullNamespaceName.split('.'), true), [
                        nestedType.name
                    ], false);
                    var fullyQualifiedServiceName = serviceName.join('.');
                    onService(nestedType, get(ast, serviceName), fullyQualifiedServiceName);
                }
            });
        }
    });
    Object.keys(ast)
        .forEach(function (serviceName) {
        var lookupType = root.lookup(serviceName);
        if (lookupType instanceof protobufjs_1.Service) {
            // No namespace, root services
            onService(serviceByName(root, serviceName), ast[serviceName], serviceName);
        }
    });
}
exports.walkServices = walkServices;
function walkNamespace(root, onNamespace, parentNamespace) {
    var namespace = parentNamespace ? parentNamespace : root;
    var nestedType = namespace.nested;
    if (nestedType) {
        Object.keys(nestedType).forEach(function (typeName) {
            var nestedNamespace = root.lookup("".concat(namespace.fullName, ".").concat(typeName));
            if (nestedNamespace && isNamespace(nestedNamespace)) {
                onNamespace(nestedNamespace);
                walkNamespace(root, onNamespace, nestedNamespace);
            }
        });
    }
}
exports.walkNamespace = walkNamespace;
function serviceByName(root, serviceName) {
    if (!root.nested) {
        throw new Error('Empty PROTO!');
    }
    var serviceLeaf = root.nested[serviceName];
    return root.lookupService(serviceLeaf.fullName);
}
exports.serviceByName = serviceByName;
function promisifyRead(fileName) {
    return new Promise(function (resolve, reject) {
        fs.readFile(fileName, 'utf8', function (err, result) {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
}
function addIncludePathToRoot(root, includePaths) {
    var originalResolvePath = root.resolvePath;
    root.resolvePath = function (origin, target) {
        if (path.isAbsolute(target)) {
            return target;
        }
        for (var _i = 0, includePaths_1 = includePaths; _i < includePaths_1.length; _i++) {
            var directory = includePaths_1[_i];
            var fullPath = path.join(directory, target);
            try {
                fs.accessSync(fullPath, fs.constants.R_OK);
                return fullPath;
            }
            catch (err) {
                continue;
            }
        }
        return originalResolvePath(origin, target);
    };
}
function isNamespace(lookupType) {
    if ((lookupType instanceof protobufjs_1.Namespace) &&
        !(lookupType instanceof protobufjs_1.Service) &&
        !(lookupType instanceof protobufjs_1.Type) &&
        !(lookupType instanceof protobufjs_1.Enum) &&
        !(lookupType instanceof protobufjs_1.Field) &&
        !(lookupType instanceof protobufjs_1.MapField) &&
        !(lookupType instanceof protobufjs_1.OneOf) &&
        !(lookupType instanceof protobufjs_1.Method)) {
        return true;
    }
    return false;
}
//# sourceMappingURL=proto.js.map