"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

function _default(babel) {
  const {
    types: t
  } = babel;
  const document = t.identifier('document');
  const createElement = t.identifier('createElement');
  const createElementNS = t.identifier('createElementNS');
  const createDocumentFragment = t.identifier('createDocumentFragment');
  const createTextNode = t.identifier('createTextNode');
  const appendChild = t.identifier('appendChild');
  const setAttribute = t.identifier('setAttribute');
  const hasOwnProperty = t.identifier('hasOwnProperty');
  const string = t.stringLiteral('string');
  const length = t.identifier('length');
  const ArrayClass = t.identifier('Array');
  const StringClass = t.identifier('String');
  const NodeClass = t.identifier('Node');
  const zero = t.numericLiteral(0);
  const one = t.numericLiteral(1);

  function unwrapLiteral(node) {
    return t.conditionalExpression(t.logicalExpression('||', t.binaryExpression('instanceof', node, NodeClass), t.binaryExpression('instanceof', node, ArrayClass)), node, text(node));
  }

  function text(string) {
    return t.callExpression(t.memberExpression(document, createTextNode), [string]);
  }

  function append(node, child, returnPartial) {
    let call = t.callExpression(t.memberExpression(node, appendChild), [child]);
    if (returnPartial) return call;
    return t.expressionStatement(call);
  }

  function declare(name, value) {
    return t.variableDeclaration("let", [t.variableDeclarator(name, value)]);
  }

  function setAttr(elem, name, value, opts, path) {
    const unsafeRegex = /^unsafe-/,
          valueId = path.scope.generateUidIdentifier("value"),
          valueVar = declare(valueId, value),
          insertedValue = t.isStringLiteral(value) ? value : valueId;
    ;
    let expr;

    if (unsafeRegex.test(name.value)) {
      expr = t.assignmentExpression('=', t.memberExpression(elem, t.stringLiteral(name.value.replace(unsafeRegex, '')), true), insertedValue);
    } else {
      expr = t.callExpression(t.memberExpression(elem, setAttribute), [name, insertedValue]);
    }

    let condition = null,
        returnStuff = []; // Only do for computed values

    if (!t.isStringLiteral(value)) {
      returnStuff.push(valueVar);

      if (opts.nullValues === true) {
        condition = t.binaryExpression("!==", valueId, t.nullLiteral());
      }

      if (opts.undefinedValues === true) {
        let conditionalExpr = t.binaryExpression("!==", valueId, t.unaryExpression("void", t.numericLiteral(0)));

        if (condition) {
          condition = t.logicalExpression('||', condition, conditionalExpr);
        } else {
          condition = conditionalExpr;
        }
      }
    }

    if (condition) {
      returnStuff.push(t.expressionStatement(t.logicalExpression("&&", condition, expr)));
    } else {
      returnStuff.push(t.expressionStatement(expr));
    }

    return returnStuff;
  }

  function generateHTMLNode(path, jsx, opts) {
    if (t.isJSXElement(jsx)) {
      const name = path.scope.generateUidIdentifier("elem");
      const tagName = jsx.openingElement.name.name;
      let namespace = null;
      let elems = [];

      for (let i = 0; i < jsx.openingElement.attributes.length; i++) {
        let attribute = jsx.openingElement.attributes[i];

        if (t.isJSXSpreadAttribute(attribute)) {
          const arg = path.scope.generateUidIdentifier("attrs");
          const iter = path.scope.generateUidIdentifier("attr");
          elems.push(declare(arg, attribute.argument));
          elems.push(t.forInStatement(iter, arg, t.ifStatement(t.callExpression(t.memberExpression(arg, hasOwnProperty), [iter]), t.blockStatement(setAttr(name, iter, t.memberExpression(arg, iter, true), opts, path)))));
        } else {
          if (attribute.name.name === "namespace") {
            namespace = attribute.value;
            continue;
          }

          let value = attribute.value;
          if (t.isJSXExpressionContainer(value)) value = value.expression;
          elems.push(...setAttr(name, t.stringLiteral(attribute.name.name), value, opts, path));
        }

        ;
      }

      let call;

      if (tagName === "DocumentFragment") {
        call = t.callExpression(t.memberExpression(document, createDocumentFragment), []);
      } else if (namespace) {
        call = t.callExpression(t.memberExpression(document, createElementNS), [namespace, t.stringLiteral(tagName)]);
      } else {
        call = t.callExpression(t.memberExpression(document, createElement), [t.stringLiteral(tagName)]);
      }

      const decl = t.variableDeclaration("const", [t.variableDeclarator(name, call)]);
      elems.unshift(decl);

      for (let i = 0; i < jsx.children.length; i++) {
        let child = generateHTMLNode(path, jsx.children[i], opts);
        if (child === null) continue;
        elems.push(...child.elems);

        if (child.maybeMultiple) {
          const counter = path.scope.generateUidIdentifier('i');
          const ref = path.scope.generateUidIdentifier('ref');
          elems.push(t.ifStatement(t.binaryExpression('instanceof', child.id, ArrayClass), t.blockStatement([t.forStatement(declare(counter, zero), t.binaryExpression("<", counter, t.memberExpression(child.id, length)), t.assignmentExpression('+=', counter, one), append(name, unwrapLiteral(t.memberExpression(child.id, counter, true))))]), append(name, child.id)));
        } else if (child.id !== null) {
          elems.push(append(name, child.id));
        }
      }

      return {
        id: name,
        elems: elems
      };
    } else if (t.isJSXText(jsx)) {
      if (opts.noWhitespaceOnly && !jsx.value.trim()) {
        return {
          id: null,
          elems: []
        };
      }

      return {
        id: text(t.stringLiteral(jsx.value)),
        elems: []
      };
    } else if (t.isJSXExpressionContainer(jsx)) {
      const name = path.scope.generateUidIdentifier("expr");
      const res = path.scope.generateUidIdentifier("res");
      return {
        id: res,
        elems: [t.variableDeclaration("const", [t.variableDeclarator(name, jsx.expression), t.variableDeclarator(res, unwrapLiteral(name))])],
        maybeMultiple: true
      };
    } else {
      return {
        id: null,
        elems: [jsx]
      };
    }
  }

  return {
    name: "ast-transform",
    // not required
    visitor: {
      JSXElement(path, {
        opts
      }) {
        let result = generateHTMLNode(path, path.node, opts);
        path.replaceWith(t.callExpression(t.arrowFunctionExpression([], t.blockStatement(result.elems.concat(t.returnStatement(result.id)))), []));
      }

    }
  };
}