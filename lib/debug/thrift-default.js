"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Schema = void 0;

// transfer:
//   npm install --save-dev @babel/cli @babel/preset-env
//   npx babel --config-file ./lib/es/babel.config.json lib/es/thrift-default.js --out-file lib/thrift-default.js
function mappingByName(list) {
  let mapping = {};

  for (let item of list || []) {
    if (item.name) {
      mapping[item.name] = item;
    }
  }

  return mapping;
}

function removeSuffix(s, suffix) {
  if (s && s.endsWith(suffix)) {
    return s.slice(0, s.length - suffix.length);
  }

  return s;
}

const DEFAULT_VALUE_MAP = {
  "string": '""',
  "i64": "0",
  "i32": "0",
  "i16": "0",
  "i8": "0",
  // "boolean": "false",
  "bool": "false",
  "binary": "''"
};
const DEFAULT_VALUE_MAP_WITH_COMMENT = {};
Object.keys(DEFAULT_VALUE_MAP).forEach(key => DEFAULT_VALUE_MAP_WITH_COMMENT[key] = {
  value: DEFAULT_VALUE_MAP[key],
  comment: key
}); // schema keys: 
// [
//   "constants",
//   "enums",
//   "name",
//   "services",
//   "structs",// {name, fields:[{index,name,type,required}]}
//   "typedefs"
// ]

class Schema {
  constructor(schema) {
    this.schema = schema;
    this.structMapping = mappingByName(schema.structs);
    this.enumMapping = mappingByName(schema.enums);
    this.constantMapping = mappingByName(schema.constants);
    this.typedefsMapping = mappingByName(schema.typedefs);
    this.servicesMapping = mappingByName(schema.services);
  } // service: optional, service name, default is the first service
  // returns [{name, arguments, returnType}]


  genServiceFunctionsDefault(service, options) {
    let foundService;

    if (!service) {
      foundService = this.servicesMapping[this.schema.services[0].name];
    } else {
      foundService = this.servicesMapping[service];
    }

    if (!foundService) {
      throw new Error("service not found:" + service);
    }

    let types = [];
    options = options || {};
    let valueMap = { ...DEFAULT_VALUE_MAP_WITH_COMMENT
    };

    for (let func of foundService.functions || []) {
      let returnType = {
        type: func.returnType,
        default: this._genTypeDefault(valueMap, func.returnType, "", options).value
      };
      let args = [];

      for (let arg of func.arguments) {
        args.push({ ...arg,
          default: this._genTypeDefault(valueMap, arg.type, "", options).value
        });
      }

      types.push({
        name: func.name,
        returnType,
        arguments: args
      });
    }

    return types;
  } // what if recursive type like: 
  //  struct A {
  //      B b   
  // }
  // struct B {
  //    list<A> array   
  // }
  // return a {value,comment, primitive}


  _genTypeDefault(valueMap, type, indent, options) {
    let {
      withComment
    } = options;
    let nextIndent = indent + "    ";
    let defaultValue = valueMap[type];

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    if (type.startsWith("list<")) {
      valueMap[type] = {
        value: "[]"
      };
      let subType = removeSuffix(type.slice("list<".length), ">");

      let subTypeGen = this._genTypeDefault(valueMap, subType, nextIndent, options);

      valueMap[type].value = "[" + subTypeGen.value + "]";
      valueMap[type].comment = type;
      return valueMap[type];
    } else if (type.startsWith("map<")) {
      valueMap[type] = {
        value: "{}"
      };
      let subTypes = removeSuffix(type.slice("map<".length), ">");
      let idx = subTypes.indexOf(",");
      let keyType, valueType;

      if (idx !== -1) {
        keyType = subTypes.slice(0, idx).trim();
        valueType = subTypes.slice(idx + 1).trim();
      }

      if (!keyType || !valueType) {
        throw new Error("bad map type:" + type);
      }

      let keyDefault = this._genTypeDefault(valueMap, keyType, nextIndent, options);

      if (!keyDefault.value.startsWith('"')) {
        keyDefault.value = '"' + keyDefault.value + '"';
      }

      let valueDefault = this._genTypeDefault(valueMap, valueType, nextIndent, options);

      valueMap[type].value = `{\n${nextIndent}${keyDefault.value}:${valueDefault.value}\n${indent}}`;
      valueMap[type].comment = type;
      return valueMap[type];
    }

    let name = type;
    let foundType;

    if (foundType = this.structMapping[name]) {
      valueMap[type] = {
        value: "{}"
      }; // fields

      let fields = [];
      let foundFields = foundType.fields || [];
      let length = foundFields.length;
      let i = 0;

      for (let field of foundFields) {
        let comma = i < length - 1 ? "," : "";

        let fieldDefault = this._genTypeDefault(valueMap, field.type, nextIndent, options);

        let comment = comma;

        if (withComment && fieldDefault.comment) {
          comment = `${comma} // ${fieldDefault.comment}`;
        }

        fields.push(`${nextIndent}"${field.name}": ${fieldDefault.value}${comment}`);
        i++;
      }

      valueMap[type].value = `{\n${fields.join("\n")}\n${indent}}`;
      return valueMap[type];
    } else if (foundType = this.enumMapping[name]) {
      // by default i32
      let members = foundType.members;
      let value = members && members[0].value || "0";
      let comment = `${foundType.name}:${foundType.members.map(e => e.name + "=" + e.value).join(", ")}`;
      return valueMap[type] = {
        value,
        comment
      };
    } else if (foundType = this.typedefsMapping[name]) {
      throw new Error("typedef not implemeneted");
    } else {
      throw new Error("type not found:" + type);
    }
  }

}

exports.Schema = Schema;