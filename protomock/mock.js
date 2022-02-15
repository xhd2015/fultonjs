import { Enum, MapField, Type } from 'protobufjs';
const MAX_STACK_SIZE = 3;
/**
 * Mock method response
 */
export function mockResponseMethods(service, mocks) {
    return mockMethodReturnType(service, 1 /* response */, mocks);
}
/**
 * Mock methods request
 */
export function mockRequestMethods(service, mocks) {
    return mockMethodReturnType(service, 0 /* request */, mocks);
}
function mockMethodReturnType(service, type, mocks) {
    const root = service.root;
    const serviceMethods = service.methods;
    return Object.keys(serviceMethods).reduce((methods, method) => {
        const serviceMethod = serviceMethods[method];
        const methodMessageType = type === 0 /* request */
            ? serviceMethod.requestType
            : serviceMethod.responseType;
        const messageType = root.lookupType(methodMessageType);
        methods[method] = () => {
            let data = {};
            if (!mocks) {
                data = mockTypeFields(messageType);
            }
            //TODO
            return { plain: data, message: messageType.fromObject(data), annotation: null };
        };
        return methods;
    }, {});
}
/**
* Mock a field type
*/
function mockTypeFields(type, stackDepth = {}) {
    if (stackDepth[type.name] > MAX_STACK_SIZE) {
        return {};
    }
    if (!stackDepth[type.name]) {
        stackDepth[type.name] = 0;
    }
    stackDepth[type.name]++;
    const fieldsData = {};
    return type.fieldsArray.reduce((data, field) => {
        field.resolve();
        if (field.parent !== field.resolvedType) {
            if (field.repeated) {
                data[field.name] = [mockField(field, stackDepth)];
            }
            else {
                data[field.name] = mockField(field, stackDepth);
            }
        }
        return data;
    }, fieldsData);
}
/**
 * Mock enum
 */
function mockEnum(enumType) {
    const enumKey = Object.keys(enumType.values)[0];
    return enumType.values[enumKey];
}
/**
 * Mock a field
 */
function mockField(field, stackDepth) {
    if (field instanceof MapField) {
        let mockPropertyValue = null;
        if (field.resolvedType === null) {
            mockPropertyValue = mockScalar(field.type, field.name);
        }
        if (mockPropertyValue === null) {
            const resolvedType = field.resolvedType;
            if (resolvedType instanceof Type) {
                if (resolvedType.oneofs) {
                    mockPropertyValue = pickOneOf(resolvedType.oneofsArray);
                }
                else {
                    mockPropertyValue = mockTypeFields(resolvedType);
                }
            }
            else if (resolvedType instanceof Enum) {
                mockPropertyValue = mockEnum(resolvedType);
            }
            else if (resolvedType === null) {
                mockPropertyValue = {};
            }
        }
        return {
            [mockScalar(field.keyType, field.name)]: mockPropertyValue,
        };
    }
    if (field.resolvedType instanceof Type) {
        return mockTypeFields(field.resolvedType, stackDepth);
    }
    if (field.resolvedType instanceof Enum) {
        return mockEnum(field.resolvedType);
    }
    const mockPropertyValue = mockScalar(field.type, field.name);
    if (mockPropertyValue === null) {
        const resolvedField = field.resolve();
        return mockField(resolvedField, stackDepth);
    }
    else {
        return mockPropertyValue;
    }
}
function pickOneOf(oneofs) {
    return oneofs.reduce((fields, oneOf) => {
        fields[oneOf.name] = mockField(oneOf.fieldsArray[0]);
        return fields;
    }, {});
}
export function mockScalarMore(type, fieldName) {
    return mockScalar(type, fieldName);
}
function mockScalar(type, fieldName) {
    switch (type) {
        case 'string':
            return interpretMockViaFieldName(fieldName);
        case 'number':
            return 10;
        case 'bool':
            return true;
        case 'int32':
            return 10;
        case 'int64':
            return 20;
        case 'uint32':
            return 100;
        case 'uint64':
            return 100;
        case 'sint32':
            return 100;
        case 'sint64':
            return 1200;
        case 'fixed32':
            return 1400;
        case 'fixed64':
            return 1500;
        case 'sfixed32':
            return 1600;
        case 'sfixed64':
            return 1700;
        case 'double':
            return 1.4;
        case 'float':
            return 1.1;
        case 'bytes':
            return new Buffer('Hello');
        default:
            return null;
    }
}
function mockScalarZero(type) {
    switch (type) {
        case 'string':
            return '';
        case 'number':
            return 0;
        case 'bool':
            return false;
        case 'int32':
            return 0;
        case 'int64':
            return 0;
        case 'uint32':
            return 0;
        case 'uint64':
            return 0;
        case 'sint32':
            return 0;
        case 'sint64':
            return 0;
        case 'fixed32':
            return 0;
        case 'fixed64':
            return 0;
        case 'sfixed32':
            return 0;
        case 'sfixed64':
            return 0;
        case 'double':
            return 0.0;
        case 'float':
            return 0.0;
        case 'bytes':
            return Buffer.from('');
        default:
            return null;
    }
}
function mockEnumZero(enumType) {
    const enumKey = Object.keys(enumType.values)[0];
    return enumType.values[enumKey];
}
/**
 * Tries to guess a mock value from the field name.
 * Default Hello.
 */
function interpretMockViaFieldName(fieldName) {
    const fieldNameLower = fieldName.toLowerCase();
    if (fieldNameLower.startsWith('id') || fieldNameLower.endsWith('id')) {
        return "id";
        //   return uuid.v4();
    }
    return 'Hello';
}
export function enumComment(enumType) {
    return Object.keys(enumType.values).map(key => [key, enumType.values[key]]).map(([k, v]) => `${v}=${k}`).join(" ");
}
// export function mockScalarWithMappingComments(baseMocker?: (enumType: Enum) => number) {
//     baseMocker = baseMocker || mockEnumZero
//     return (enumType: Enum): any => {
//     }
// }
export const ANNOTATION = Symbol.for('annotation');
const defaultMockOptions = {
    mockScalar: mockScalarZero,
    mockEnum: mockEnumZero,
};
export class Mocker {
    constructor(options) {
        this.options = Object.assign(Object.assign({}, defaultMockOptions), options);
        this.reset();
    }
    reset() {
        this.stackDepth = {};
    }
    // the type must be resolved first
    // deprecated, use mockTypeData
    mockType(type) {
        const { data } = this.mockTypeData(type);
        return data;
    }
    // will return {data,annotation}
    mockTypeData(type) {
        //no map type, just map field
        if (type instanceof Type) {
            if (type.oneofs) {
                return this._pickOneOf(type.oneofsArray);
            }
            return this._mockTypeFields(type);
        }
        if (type instanceof Enum) {
            return { data: this.mockEnum(type), annotation: { [ANNOTATION]: enumComment(type) } };
        }
        else if (typeof type === 'string') {
            return { data: this.mockScalar(type), annotation: null };
        }
        return null;
    }
    /**
     * Mock methods request
     */
    mockRequestMethods(service) {
        return this.mockMethodReturnType(service, 0 /* request */);
    }
    mockMethodReturnType(service, type) {
        const root = service.root;
        const serviceMethods = service.methods;
        return Object.keys(serviceMethods).reduce((methods, method) => {
            const serviceMethod = serviceMethods[method];
            const methodMessageType = type === 0 /* request */
                ? serviceMethod.requestType
                : serviceMethod.responseType;
            const messageType = root.lookupType(methodMessageType);
            methods[method] = () => {
                const { data, annotation } = this.mockTypeData(messageType);
                return { plain: data, message: messageType.fromObject(data), annotation: annotation };
            };
            return methods;
        }, {});
    }
    /**
    * Mock a field type
    */
    _mockTypeFields(type) {
        if (this.stackDepth[type.name] > MAX_STACK_SIZE) {
            return { data: null, annotation: null };
        }
        if (!this.stackDepth[type.name]) {
            this.stackDepth[type.name] = 0;
        }
        this.stackDepth[type.name]++;
        const data = {};
        const annotation = {};
        return type.fieldsArray.reduce(({ data, annotation }, field) => {
            field = field.resolve();
            if (field.parent !== field.resolvedType) {
                const { data: fieldData, annotation: fieldAnnotation } = this._mockField(field);
                if (field.repeated) {
                    data[field.name] = [fieldData];
                    annotation[field.name] = [Object.assign({}, fieldAnnotation)];
                }
                else {
                    data[field.name] = fieldData;
                    annotation[field.name] = Object.assign({}, fieldAnnotation);
                }
            }
            return {
                data,
                annotation
            };
        }, { data, annotation });
    }
    /**
     * Mock a field
     */
    _mockField(field) {
        field = field.resolve();
        if (field instanceof MapField) {
            let { data, annotation } = this.mockTypeData(field.type || field.resolvedType);
            const key = this.mockScalar(field.keyType);
            return {
                data: {
                    [key]: data
                },
                annotation: {
                    [key]: annotation,
                }
            };
        }
        return this.mockTypeData(field.resolvedType || field.type);
    }
    _pickOneOf(oneofs) {
        const data = {};
        const annotation = {};
        return oneofs.reduce(({ data, annotation }, oneOf) => {
            const mock = this._mockField(oneOf.fieldsArray[0]);
            return {
                data: Object.assign(Object.assign({}, data), { [oneOf.name]: mock.data }),
                annotation: Object.assign(Object.assign({}, annotation), { [oneOf.name]: mock.annotation })
            };
        }, { data, annotation });
    }
    // path: [a,b,c,0,MAP_KEY,MAP_VALUE]
    // simple types
    mockEnum(type) {
        return this.options.mockEnum(type);
    }
    mockScalar(type) {
        return this.options.mockScalar(type);
    }
}
