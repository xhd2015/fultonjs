"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromFileName = fromFileName;
exports.serviceByName = serviceByName;
exports.walkNamespace = walkNamespace;
exports.walkServices = walkServices;

var fs = _interopRequireWildcard(require("fs"));

var _grpcJs = require("@grpc/grpc-js");

var get = _interopRequireWildcard(require("lodash/get"));

var path = _interopRequireWildcard(require("path"));

var _protobufjs = require("protobufjs");

var _protoLoader = require("@grpc/proto-loader");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

/**
 * Proto ast from filename
 */
function fromFileName(protoPath, includeDirs) {
  return __awaiter(this, void 0, void 0, function* () {
    includeDirs = includeDirs ? [...includeDirs] : [];

    if (path.isAbsolute(protoPath)) {
      includeDirs.push(path.dirname(protoPath));
    } else {
      includeDirs.push(path.dirname(path.join(process.cwd(), protoPath)));
    }

    const packageDefinition = yield (0, _protoLoader.load)(path.basename(protoPath), {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs
    });
    const protoAST = (0, _grpcJs.loadPackageDefinition)(packageDefinition);
    const protoRoot = new _protobufjs.Root();

    if (includeDirs) {
      addIncludePathToRoot(protoRoot, includeDirs);
    }

    const root = yield protoRoot.load(protoPath, {
      keepCase: true
    });
    const protoText = yield promisifyRead(protoPath);
    return {
      fileName: protoPath.split(path.sep).pop() || '',
      filePath: protoPath,
      protoText,
      ast: protoAST,
      root
    };
  });
}
/**
 * Walk through services
 */


function walkServices(proto, onService) {
  const {
    ast,
    root
  } = proto;
  walkNamespace(root, namespace => {
    const nestedNamespaceTypes = namespace.nested;

    if (nestedNamespaceTypes) {
      Object.keys(nestedNamespaceTypes).forEach(nestedTypeName => {
        const fullNamespaceName = namespace.fullName.startsWith('.') ? namespace.fullName.replace('.', '') : namespace.fullName;
        const nestedType = root.lookup(`${fullNamespaceName}.${nestedTypeName}`);

        if (nestedType instanceof _protobufjs.Service) {
          const serviceName = [...fullNamespaceName.split('.'), nestedType.name];
          const fullyQualifiedServiceName = serviceName.join('.');
          const getFn = get.default || get;
          onService(nestedType, getFn(ast, serviceName), fullyQualifiedServiceName);
        }
      });
    }
  });
  Object.keys(ast).forEach(serviceName => {
    const lookupType = root.lookup(serviceName);

    if (lookupType instanceof _protobufjs.Service) {
      // No namespace, root services
      onService(serviceByName(root, serviceName), ast[serviceName], serviceName);
    }
  });
}

function walkNamespace(root, onNamespace, parentNamespace) {
  const namespace = parentNamespace ? parentNamespace : root;
  const nestedType = namespace.nested;

  if (nestedType) {
    Object.keys(nestedType).forEach(typeName => {
      const nestedNamespace = root.lookup(`${namespace.fullName}.${typeName}`);

      if (nestedNamespace && isNamespace(nestedNamespace)) {
        onNamespace(nestedNamespace);
        walkNamespace(root, onNamespace, nestedNamespace);
      }
    });
  }
}

function serviceByName(root, serviceName) {
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
      } else {
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
      } catch (err) {
        continue;
      }
    }

    return originalResolvePath(origin, target);
  };
}

function isNamespace(lookupType) {
  if (lookupType instanceof _protobufjs.Namespace && !(lookupType instanceof _protobufjs.Service) && !(lookupType instanceof _protobufjs.Type) && !(lookupType instanceof _protobufjs.Enum) && !(lookupType instanceof _protobufjs.Field) && !(lookupType instanceof _protobufjs.MapField) && !(lookupType instanceof _protobufjs.OneOf) && !(lookupType instanceof _protobufjs.Method)) {
    return true;
  }

  return false;
}