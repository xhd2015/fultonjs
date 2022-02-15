
import { Enum, Field, MapField, Message, OneOf, Service, Type } from 'protobufjs';

export interface MethodPayload {
    plain: { [key: string]: any };
    message: Message;
    annotation:any;
}

export type ServiceMethodsPayload = {
    [name: string]: () => MethodPayload
};

const enum MethodType {
    request,
    response
}
const MAX_STACK_SIZE = 3;


/**
 * Mock method response
 */
export function mockResponseMethods(
    service: Service,
    mocks?: void | {},
) {
    return mockMethodReturnType(
        service,
        MethodType.response,
        mocks
    );
}

/**
 * Mock methods request
 */
export function mockRequestMethods(
    service: Service,
    mocks?: void | {},
): ServiceMethodsPayload {
    return mockMethodReturnType(
        service,
        MethodType.request,
        mocks
    );
}


function mockMethodReturnType(
    service: Service,
    type: MethodType,
    mocks?: void | {},
): ServiceMethodsPayload {
    const root = service.root;
    const serviceMethods = service.methods;

    return Object.keys(serviceMethods).reduce((methods: ServiceMethodsPayload, method: string) => {
        const serviceMethod = serviceMethods[method];

        const methodMessageType = type === MethodType.request
            ? serviceMethod.requestType
            : serviceMethod.responseType;

        const messageType = root.lookupType(methodMessageType);

        methods[method] = () => {
            let data = {};
            if (!mocks) {
                data = mockTypeFields(messageType);
            }
            //TODO
            return { plain: data, message: messageType.fromObject(data), annotation:null };
        };

        return methods;
    }, {});
}

type StackDepth = {
    [type: string]: number;
};

/**
* Mock a field type
*/
function mockTypeFields(type: Type, stackDepth: StackDepth = {}): object {
    if (stackDepth[type.name] > MAX_STACK_SIZE) {
        return {};
    }
    if (!stackDepth[type.name]) {
        stackDepth[type.name] = 0;
    }
    stackDepth[type.name]++;

    const fieldsData: { [key: string]: any } = {};

    return type.fieldsArray.reduce((data, field) => {
        field.resolve();

        if (field.parent !== field.resolvedType) {
            if (field.repeated) {
                data[field.name] = [mockField(field, stackDepth)];
            } else {
                data[field.name] = mockField(field, stackDepth);
            }
        }

        return data;
    }, fieldsData);
}

/**
 * Mock enum
 */
function mockEnum(enumType: Enum): number {
    const enumKey = Object.keys(enumType.values)[0];

    return enumType.values[enumKey];
}

/**
 * Mock a field
 */
function mockField(field: Field, stackDepth?: StackDepth): any {
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
                } else {
                    mockPropertyValue = mockTypeFields(resolvedType);
                }
            } else if (resolvedType instanceof Enum) {
                mockPropertyValue = mockEnum(resolvedType);
            } else if (resolvedType === null) {
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
    } else {
        return mockPropertyValue;
    }
}

function pickOneOf(oneofs: OneOf[]) {
    return oneofs.reduce((fields: { [key: string]: any }, oneOf) => {
        fields[oneOf.name] = mockField(oneOf.fieldsArray[0]);
        return fields;
    }, {});
}

export function mockScalarMore(type: string, fieldName: string): any {
    return mockScalar(type, fieldName)
}
function mockScalar(type: string, fieldName: string): any {
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

function mockScalarZero(type: string): any {
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
function mockEnumZero(enumType: Enum): number {
    const enumKey = Object.keys(enumType.values)[0];
    return enumType.values[enumKey];
}

/**
 * Tries to guess a mock value from the field name.
 * Default Hello.
 */
function interpretMockViaFieldName(fieldName: string): string {
    const fieldNameLower = fieldName.toLowerCase();

    if (fieldNameLower.startsWith('id') || fieldNameLower.endsWith('id')) {
        return "id"
        //   return uuid.v4();
    }

    return 'Hello';
}

export function enumComment(enumType: Enum): string {
    return Object.keys(enumType.values).map(key => [key, enumType.values[key]]).map(([k, v]) => `${v}=${k}`).join(" ")
}

// export function mockScalarWithMappingComments(baseMocker?: (enumType: Enum) => number) {
//     baseMocker = baseMocker || mockEnumZero
//     return (enumType: Enum): any => {

//     }
// }

export const ANNOTATION = Symbol.for('annotation')

interface MockOptions {
    mockScalar?: (type: string) => any
    mockEnum?: (enumType: Enum) => number
}
const defaultMockOptions: MockOptions = {
    mockScalar: mockScalarZero,
    mockEnum: mockEnumZero,
}

interface MockResult {
    data: any
    annotation: any
}

export class Mocker {
    options: MockOptions;
    stackDepth: StackDepth;

    constructor(options?: MockOptions) {
        this.options = { ...defaultMockOptions, ...options }
        this.reset()
    }
    reset() {
        this.stackDepth = {}
    }

    // the type must be resolved first
    // deprecated, use mockTypeData
    mockType(type: string | Type | Enum) {
        const { data } = this.mockTypeData(type)
        return data
    }

    // will return {data,annotation}
    mockTypeData(type: string | Type | Enum): { data: any, annotation: any } {
        //no map type, just map field
        if (type instanceof Type) {
            if (type.oneofs) {
                return this._pickOneOf(type.oneofsArray);
            }
            return this._mockTypeFields(type);
        }
        if (type instanceof Enum) {
            return { data: this.mockEnum(type), annotation: { [ANNOTATION]: enumComment(type) } }
        } else if (typeof type === 'string') {
            return { data: this.mockScalar(type), annotation: null }
        }
        return null
    }


    /**
     * Mock methods request
     */
    mockRequestMethods(service: Service): ServiceMethodsPayload {
        return this.mockMethodReturnType(service, MethodType.request);
    }

    mockMethodReturnType(service: Service, type: MethodType): ServiceMethodsPayload {
        const root = service.root;
        const serviceMethods = service.methods;

        return Object.keys(serviceMethods).reduce((methods: ServiceMethodsPayload, method: string) => {
            const serviceMethod = serviceMethods[method];

            const methodMessageType = type === MethodType.request
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
    _mockTypeFields(type: Type): MockResult {
        if (this.stackDepth[type.name] > MAX_STACK_SIZE) {
            return { data: null, annotation: null };
        }
        if (!this.stackDepth[type.name]) {
            this.stackDepth[type.name] = 0;
        }
        this.stackDepth[type.name]++;

        const data: { [key: string]: any } = {};
        const annotation: { [key: string]: any } = {}

        return type.fieldsArray.reduce(({ data, annotation }, field) => {
            field = field.resolve();

            if (field.parent !== field.resolvedType) {
                const { data: fieldData, annotation: fieldAnnotation } = this._mockField(field)
                if (field.repeated) {
                    data[field.name] = [fieldData]
                    annotation[field.name] = [{...fieldAnnotation }]
                } else {
                    data[field.name] = fieldData
                    annotation[field.name] = { ...fieldAnnotation }
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
    _mockField(field: Field): MockResult {
        field = field.resolve()
        if (field instanceof MapField) {
            let { data, annotation } = this.mockTypeData(field.type || field.resolvedType);
            const key = this.mockScalar(field.keyType)
            return {
                data: {
                    [key]: data
                },
                annotation: {
                    [key]: annotation,
                }
            };
        }
        return this.mockTypeData(field.resolvedType || field.type)
    }

    _pickOneOf(oneofs: OneOf[]): MockResult {
        const data: { [key: string]: any } = {}
        const annotation: { [key: string]: any } = {}
        return oneofs.reduce(({ data, annotation }, oneOf) => {
            const mock = this._mockField(oneOf.fieldsArray[0]);
            return {
                data: {
                    ...data,
                    [oneOf.name]: mock.data,
                },
                annotation: {
                    ...annotation,
                    [oneOf.name]:mock.annotation,
                }
            }
        }, { data, annotation });
    }

    // path: [a,b,c,0,MAP_KEY,MAP_VALUE]
    // simple types
    mockEnum(type: Enum) {
        return this.options.mockEnum(type)
    }
    mockScalar(type: string) {
        return this.options.mockScalar(type)
    }
}