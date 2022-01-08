import * as fs from 'fs';
import {GrpcObject, loadPackageDefinition} from "@grpc/grpc-js"
import * as get from 'lodash/get';
import * as path from 'path';
import {
  Enum,
  Field,
  MapField, Method,
  Namespace,
  OneOf,
  ReflectionObject,
  Root,
  Service,
  Service as ProtoService,
  Type,
} from 'protobufjs';

import {load as grpcDef} from '@grpc/proto-loader';

export interface Proto {
  fileName: string;
  filePath: string;
  protoText: string;
  ast: GrpcObject;
  root: Root;
}

/**
 * Proto ast from filename
 */
export async function fromFileName(protoPath: string, includeDirs?: string[]): Promise<Proto> {
  includeDirs = includeDirs ? [...includeDirs] : [];

  if (path.isAbsolute(protoPath)) {
    includeDirs.push(
      path.dirname(protoPath)
    );
  } else {
    includeDirs.push(
      path.dirname(path.join(process.cwd(), protoPath))
    );
  }

  const packageDefinition = await grpcDef(path.basename(protoPath), {
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

  const root = await protoRoot.load(
    protoPath,
    {
      keepCase: true,
    }
  );

  const protoText = await promisifyRead(protoPath);

  return {
    fileName: protoPath.split(path.sep).pop() || '',
    filePath: protoPath,
    protoText,
    ast: protoAST,
    root,
  };
}

/**
 * Walk through services
 */
export function walkServices(proto: Proto, onService: (service: Service, def: any, serviceName: string) => void) {
  const {ast, root} = proto;

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
          const getFn = get.default || get
          onService(nestedType as Service, getFn(ast, serviceName), fullyQualifiedServiceName);
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

export function walkNamespace(root: Root, onNamespace: (namespace: Namespace) => void, parentNamespace?: Namespace) {
  const namespace = parentNamespace ? parentNamespace : root;
  const nestedType = namespace.nested;

  if (nestedType) {
    Object.keys(nestedType).forEach((typeName: string) => {
      const nestedNamespace = root.lookup(`${namespace.fullName}.${typeName}`);
      if (nestedNamespace && isNamespace(nestedNamespace)) {
        onNamespace(nestedNamespace as Namespace);
        walkNamespace(root, onNamespace, nestedNamespace as Namespace);
      }
    });
  }
}

export function serviceByName(root: Root, serviceName: string): ProtoService {
  if (!root.nested) {
    throw new Error('Empty PROTO!');
  }

  const serviceLeaf = root.nested[serviceName];
  return root.lookupService(serviceLeaf.fullName);
}

function promisifyRead(fileName: string): Promise<string> {
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

function addIncludePathToRoot(root: Root, includePaths: string[]) {
  const originalResolvePath = root.resolvePath;
  root.resolvePath = (origin: string, target: string) => {
    if (path.isAbsolute(target)) {
      return target;
    }
    for (const directory of includePaths) {
      const fullPath: string = path.join(directory, target);
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

function isNamespace(lookupType: ReflectionObject) {
  if (
    (lookupType instanceof Namespace) &&
    !(lookupType instanceof Service) &&
    !(lookupType instanceof Type) &&
    !(lookupType instanceof Enum) &&
    !(lookupType instanceof Field) &&
    !(lookupType instanceof MapField) &&
    !(lookupType instanceof OneOf) &&
    !(lookupType instanceof Method)
  ) {
    return true;
  }

  return false;
}