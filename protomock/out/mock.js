"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mocker = exports.mockScalarMore = exports.mockRequestMethods = exports.mockResponseMethods = void 0;
var protobufjs_1 = require("protobufjs");
var MAX_STACK_SIZE = 3;
/**
 * Mock method response
 */
function mockResponseMethods(service, mocks) {
    return mockMethodReturnType(service, 1 /* response */, mocks);
}
exports.mockResponseMethods = mockResponseMethods;
/**
 * Mock methods request
 */
function mockRequestMethods(service, mocks) {
    return mockMethodReturnType(service, 0 /* request */, mocks);
}
exports.mockRequestMethods = mockRequestMethods;
function mockMethodReturnType(service, type, mocks) {
    var root = service.root;
    var serviceMethods = service.methods;
    return Object.keys(serviceMethods).reduce(function (methods, method) {
        var serviceMethod = serviceMethods[method];
        var methodMessageType = type === 0 /* request */
            ? serviceMethod.requestType
            : serviceMethod.responseType;
        var messageType = root.lookupType(methodMessageType);
        methods[method] = function () {
            var data = {};
            if (!mocks) {
                data = mockTypeFields(messageType);
            }
            return { plain: data, message: messageType.fromObject(data) };
        };
        return methods;
    }, {});
}
/**
* Mock a field type
*/
function mockTypeFields(type, stackDepth) {
    if (stackDepth === void 0) { stackDepth = {}; }
    if (stackDepth[type.name] > MAX_STACK_SIZE) {
        return {};
    }
    if (!stackDepth[type.name]) {
        stackDepth[type.name] = 0;
    }
    stackDepth[type.name]++;
    var fieldsData = {};
    return type.fieldsArray.reduce(function (data, field) {
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
    var enumKey = Object.keys(enumType.values)[0];
    return enumType.values[enumKey];
}
/**
 * Mock a field
 */
function mockField(field, stackDepth) {
    var _a;
    if (field instanceof protobufjs_1.MapField) {
        var mockPropertyValue_1 = null;
        if (field.resolvedType === null) {
            mockPropertyValue_1 = mockScalar(field.type, field.name);
        }
        if (mockPropertyValue_1 === null) {
            var resolvedType = field.resolvedType;
            if (resolvedType instanceof protobufjs_1.Type) {
                if (resolvedType.oneofs) {
                    mockPropertyValue_1 = pickOneOf(resolvedType.oneofsArray);
                }
                else {
                    mockPropertyValue_1 = mockTypeFields(resolvedType);
                }
            }
            else if (resolvedType instanceof protobufjs_1.Enum) {
                mockPropertyValue_1 = mockEnum(resolvedType);
            }
            else if (resolvedType === null) {
                mockPropertyValue_1 = {};
            }
        }
        return _a = {},
            _a[mockScalar(field.keyType, field.name)] = mockPropertyValue_1,
            _a;
    }
    if (field.resolvedType instanceof protobufjs_1.Type) {
        return mockTypeFields(field.resolvedType, stackDepth);
    }
    if (field.resolvedType instanceof protobufjs_1.Enum) {
        return mockEnum(field.resolvedType);
    }
    var mockPropertyValue = mockScalar(field.type, field.name);
    if (mockPropertyValue === null) {
        var resolvedField = field.resolve();
        return mockField(resolvedField, stackDepth);
    }
    else {
        return mockPropertyValue;
    }
}
function pickOneOf(oneofs) {
    return oneofs.reduce(function (fields, oneOf) {
        fields[oneOf.name] = mockField(oneOf.fieldsArray[0]);
        return fields;
    }, {});
}
function mockScalarMore(type, fieldName) {
    return mockScalar(type, fieldName);
}
exports.mockScalarMore = mockScalarMore;
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
function mockScalarZero(type, fieldName) {
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
/**
 * Tries to guess a mock value from the field name.
 * Default Hello.
 */
function interpretMockViaFieldName(fieldName) {
    var fieldNameLower = fieldName.toLowerCase();
    if (fieldNameLower.startsWith('id') || fieldNameLower.endsWith('id')) {
        return "id";
        //   return uuid.v4();
    }
    return 'Hello';
}
var defaultMockOptions = {
    mockScalar: function (type) { return mockScalarZero(type, ""); },
    mockStringField: function (fieldName) {
        return "";
    },
    mockEnum: function (enumType) {
        var enumKey = Object.keys(enumType.values)[0];
        return enumType.values[enumKey];
    }
};
var Mocker = /** @class */ (function () {
    function Mocker(options) {
        this.options = __assign(__assign({}, defaultMockOptions), options);
    }
    // the type must be resolved first
    Mocker.prototype.mockType = function (type) {
        //no map type, just map field
        if (type instanceof protobufjs_1.Type) {
            if (type.oneofs) {
                return this.pickOneOf(type.oneofsArray);
            }
            return this.mockTypeFields(type);
        }
        if (type instanceof protobufjs_1.Enum) {
            return this.mockEnum(type);
        }
        else if (typeof type === 'string') {
            return this.mockScalar(type);
        }
        return null;
    };
    /**
     * Mock methods request
     */
    Mocker.prototype.mockRequestMethods = function (service) {
        return this.mockMethodReturnType(service, 0 /* request */);
    };
    Mocker.prototype.mockMethodReturnType = function (service, type) {
        var _this = this;
        var root = service.root;
        var serviceMethods = service.methods;
        return Object.keys(serviceMethods).reduce(function (methods, method) {
            var serviceMethod = serviceMethods[method];
            var methodMessageType = type === 0 /* request */
                ? serviceMethod.requestType
                : serviceMethod.responseType;
            var messageType = root.lookupType(methodMessageType);
            methods[method] = function () {
                var data = _this.mockType(messageType);
                return { plain: data, message: messageType.fromObject(data) };
            };
            return methods;
        }, {});
    };
    Mocker.prototype.mockEnum = function (type) {
        return this.options.mockEnum(type);
    };
    Mocker.prototype.mockScalar = function (type) {
        return this.options.mockScalar(type);
    };
    /**
    * Mock a field type
    */
    Mocker.prototype.mockTypeFields = function (type, stackDepth) {
        var _this = this;
        if (stackDepth === void 0) { stackDepth = {}; }
        if (stackDepth[type.name] > MAX_STACK_SIZE) {
            return {};
        }
        if (!stackDepth[type.name]) {
            stackDepth[type.name] = 0;
        }
        stackDepth[type.name]++;
        var fieldsData = {};
        return type.fieldsArray.reduce(function (data, field) {
            field = field.resolve();
            if (field.parent !== field.resolvedType) {
                if (field.repeated) {
                    data[field.name] = [_this.mockField(field, stackDepth)];
                }
                else {
                    data[field.name] = _this.mockField(field, stackDepth);
                }
            }
            return data;
        }, fieldsData);
    };
    /**
     * Mock a field
     */
    Mocker.prototype.mockField = function (field, stackDepth) {
        var _a;
        field = field.resolve();
        if (field instanceof protobufjs_1.MapField) {
            var mockPropertyValue = this.mockType(field.type || field.resolvedType);
            return _a = {},
                _a[this.mockScalar(field.keyType)] = mockPropertyValue,
                _a;
        }
        return this.mockType(field.resolvedType || field.type);
    };
    Mocker.prototype.pickOneOf = function (oneofs) {
        var _this = this;
        return oneofs.reduce(function (fields, oneOf) {
            fields[oneOf.name] = _this.mockField(oneOf.fieldsArray[0]);
            return fields;
        }, {});
    };
    return Mocker;
}());
exports.Mocker = Mocker;
//# sourceMappingURL=mock.js.map