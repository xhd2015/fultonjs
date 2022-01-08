var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as fs from 'fs';
import { loadPackageDefinition } from "@grpc/grpc-js";
import * as get from 'lodash/get';
import * as path from 'path';
import { Enum, Field, MapField, Method, Namespace, OneOf, Root, Service, Type, } from 'protobufjs';
import { load as grpcDef } from '@grpc/proto-loader';
/**
 * Proto ast from filename
 */
export function fromFileName(protoPath, includeDirs) {
    return __awaiter(this, void 0, void 0, function* () {
        includeDirs = includeDirs ? [...includeDirs] : [];
        if (path.isAbsolute(protoPath)) {
            includeDirs.push(path.dirname(protoPath));
        }
        else {
            includeDirs.push(path.dirname(path.join(process.cwd(), protoPath)));
        }
        const packageDefinition = yield grpcDef(path.basename(protoPath), {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
            includeDirs,
        });
        const protoAST = loadPackageDefinition(packageDefinition);
        const protoRoot = new Root();
        if (includeDirs) {
            addIncludePathToRoot(protoRoot, includeDirs);
        }
        const root = yield protoRoot.load(protoPath, {
            keepCase: true,
        });
        const protoText = yield promisifyRead(protoPath);
        return {
            fileName: protoPath.split(path.sep).pop() || '',
            filePath: protoPath,
            protoText,
            ast: protoAST,
            root,
        };
    });
}
/**
 * Walk through services
 */
export function walkServices(proto, onService) {
    const { ast, root } = proto;
    walkNamespace(root, namespace => {
        const nestedNamespaceTypes = namespace.nested;
        if (nestedNamespaceTypes) {
            Object.keys(nestedNamespaceTypes).forEach(nestedTypeName => {
                const fullNamespaceName = (namespace.fullName.startsWith('.'))
                    ? namespace.fullName.replace('.', '')
                    : namespace.fullName;
                const nestedType = root.lookup(`${fullNamespaceName}.${nestedTypeName}`);
                if (nestedType instanceof Service) {
                    const serviceName = [
                        ...fullNamespaceName.split('.'),
                        nestedType.name
                    ];
                    const fullyQualifiedServiceName = serviceName.join('.');
                    onService(nestedType, get(ast, serviceName), fullyQualifiedServiceName);
                }
            });
        }
    });
    Object.keys(ast)
        .forEach(serviceName => {
        const lookupType = root.lookup(serviceName);
        if (lookupType instanceof Service) {
            // No namespace, root services
            onService(serviceByName(root, serviceName), ast[serviceName], serviceName);
        }
    });
}
export function walkNamespace(root, onNamespace, parentNamespace) {
    const namespace = parentNamespace ? parentNamespace : root;
    const nestedType = namespace.nested;
    if (nestedType) {
        Object.keys(nestedType).forEach((typeName) => {
            const nestedNamespace = root.lookup(`${namespace.fullName}.${typeName}`);
            if (nestedNamespace && isNamespace(nestedNamespace)) {
                onNamespace(nestedNamespace);
                walkNamespace(root, onNamespace, nestedNamespace);
            }
        });
    }
}
export function serviceByName(root, serviceName) {
    if (!root.nested) {
        throw new Error('Empty PROTO!');
    }
    const serviceLeaf = root.nested[serviceName];
    return root.lookupService(serviceLeaf.fullName);
}
function promisifyRead(fileName) {
    return new Promise((resolve, reject) => {
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
    const originalResolvePath = root.resolvePath;
    root.resolvePath = (origin, target) => {
        if (path.isAbsolute(target)) {
            return target;
        }
        for (const directory of includePaths) {
            const fullPath = path.join(directory, target);
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
    if ((lookupType instanceof Namespace) &&
        !(lookupType instanceof Service) &&
        !(lookupType instanceof Type) &&
        !(lookupType instanceof Enum) &&
        !(lookupType instanceof Field) &&
        !(lookupType instanceof MapField) &&
        !(lookupType instanceof OneOf) &&
        !(lookupType instanceof Method)) {
        return true;
    }
    return false;
}
