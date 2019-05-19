"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metadata_1 = require("pailingual-odata/src/metadata");
const serialization_1 = require("pailingual-odata/src/serialization");
const oDataQueryFuncs_1 = require("./oDataQueryFuncs");
var parse;
class FilterExpressionParseError extends Error {
    constructor(message, internalError) {
        super(message);
        this.internalError = internalError;
    }
}
function setParser(parser) {
    parse = parser;
}
exports.setParser = setParser;
function buildExpression(funcOrNodes, params, metadata, options) {
    const nodes = typeof funcOrNodes === "function"
        ? getNodes(funcOrNodes)
        : funcOrNodes;
    try {
        return new Visitor({
            "0": { type: metadata },
            "1": getParamsMetadata(params)
        }, [], false, options)
            .transform(nodes, metadata)
            .expression;
    }
    catch (e) {
        throw new FilterExpressionParseError(`Unable parse filter expression: ${e.message}`, e);
    }
}
exports.buildExpression = buildExpression;
function getNodes(func) {
    if (!parse)
        throw new Error("Parser initilization needed. Call setParser().");
    let expressionBody = normalizeScript(func.toString());
    return parse(expressionBody);
}
function normalizeScript(script) {
    return script.replace(/function([^(]*)/, "function p");
}
function getParamsMetadata(params) {
    let properties = {};
    for (let prop of Object.keys(params || {})) {
        properties[prop] = new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Unknown);
    }
    return {
        type: new metadata_1.EdmEntityType("Params", properties),
        getValue(p) {
            return params[p];
        }
    };
}
class Expression {
    constructor(expression, type, value) {
        this.expression = expression;
        this.type = type;
        this.value = value;
    }
    toString(type, options) {
        if (this.value != null) {
            let curType = type instanceof metadata_1.EdmTypeReference
                ? type.type
                : type || (this.type && this.type.type);
            var res = null;
            if (curType) {
                if (Array.isArray(this.value))
                    res = `(${this.value.map(v => serialization_1.serializeValue(v, curType, true, options)).join(',')})`;
                else
                    res = serialization_1.serializeValue(this.value, curType, true, options);
            }
            return res || this.value.toString();
        }
        return this.expression;
    }
}
const lambdaFunctions = ["any", "all"];
class Visitor {
    constructor(args, text, asLambda, options) {
        this.args = args;
        this.text = text;
        this.asLambda = asLambda;
        this.options = options;
        this.operatorMap = {
            "==": "eq",
            "===": "eq",
            "!=": "ne",
            "!==": "ne",
            ">": "gt",
            ">=": "ge",
            "<": "lt",
            "<=": "le",
            "in": "in",
            "||": "or",
            "&&": "and",
            "!": "not",
            "+": "add",
            "-": "sub",
            "*": "mul",
            "/": "divby"
        };
    }
    transform(node, metadata) {
        const transformName = "transform" + node.type;
        if (transformName in this)
            return this[transformName](node, metadata);
        throw new Error(`Not supported node type '${node.type}'`);
    }
    transformProgram(node, metadata) {
        if (node.body.length > 1)
            throw new Error("Multiple body nodes not supported");
        return this.transform(node.body[0], metadata);
    }
    transformExpressionStatement(node, metadata) {
        return this.transform(node.expression, metadata);
    }
    transformArrowFunctionExpression(node, metadata) {
        return this.transformFunctionDeclaration(node, metadata);
    }
    transformFunctionDeclaration(node, metadata) {
        let pos = 0;
        for (let p of node.params) {
            const argName = p.name;
            this.args[argName] = this.args[pos.toString()];
            pos++;
        }
        const exp = this.transform(node.body, metadata);
        if (this.asLambda) {
            const paramName = node.params[0].name;
            return new Expression(paramName + ":" + exp.expression, exp.type, exp.type);
        }
        return exp;
    }
    transformBlockStatement(node, metadata) {
        const body = node.body.filter(n => n.type != "EmptyStatement");
        if (body.length > 1)
            throw new Error("Multiple statement functions not supported");
        return this.transform(body[0], metadata);
    }
    transformReturnStatement(node, metadata) {
        if (node.argument)
            return this.transform(node.argument, metadata);
        throw new Error("Return statement needed");
    }
    transformBinaryExpression(node) {
        if (!(node.operator in this.operatorMap))
            throw new Error(`Not supported operator '${node.operator}'`);
        let leftExp = this.transform(node.left);
        let rightExp = this.transform(node.right);
        let curType = leftExp.type || rightExp.type;
        let left = leftExp.toString(curType, this.options);
        let right = rightExp.toString(curType, this.options);
        if (node.loc) {
            if (this.text[node.loc.start.line - 1][node.loc.start.column] == "("
                && node.left.loc
                && this.text[node.loc.end.line - 1][node.left.loc.end.column] == ")")
                left = "(" + left + ")";
            if (this.text[node.loc.end.line - 1][node.loc.end.column - 1] == ")"
                && node.right.loc
                && this.text[node.loc.start.line - 1][node.right.loc.start.column - 1] == "(")
                right = "(" + right + ")";
        }
        let resultExprStr = [left, this.operatorMap[node.operator], right].join(" ");
        return new Expression(resultExprStr, curType);
    }
    transformMemberExpression(node, metadata) {
        let parts = new Array();
        let curMetadata = metadata;
        const propertyExp = node.property;
        if (node.object.type !== "Identifier") {
            let objExpr = this.transform(node.object, metadata);
            curMetadata = objExpr.type.type;
            parts.push(objExpr.expression);
        }
        else {
            let arg = this.args[node.object.name];
            curMetadata = arg.type;
            var value = arg.getValue && arg.getValue(propertyExp.name);
            if (this.asLambda)
                parts.push(node.object.name);
        }
        parts.push(propertyExp.name);
        const expression = parts.join("/");
        let propertyMetadata = curMetadata.properties[propertyExp.name]
            || curMetadata.navProperties[propertyExp.name];
        if (!propertyMetadata)
            throw new Error(`Metadata for property '${expression}' not found`);
        return new Expression(expression, propertyMetadata, value);
    }
    transformLiteral(node) {
        const v = node.value == null ? "null"
            : node.value.toString();
        return new Expression(v, undefined, node.value);
    }
    transformArrayExpression(node) {
        return new Expression("", undefined, node.elements.map(e => this.transform(e)));
    }
    transformLogicalExpression(node) {
        if (!(node.operator in this.operatorMap))
            throw new Error(`Not supported logical operator '${node.operator}'`);
        let parts = new Array();
        if (node.left)
            parts.push(this.transform(node.left).toString(undefined, this.options));
        parts.push(this.operatorMap[node.operator]);
        parts.push(this.transform(node.right).toString(undefined, this.options));
        return new Expression(parts.join(" "), new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Boolean));
    }
    transformCallExpression(node) {
        if (node.callee.type == "MemberExpression") {
            let funcName = node.callee.property.name;
            if (lambdaFunctions.indexOf(funcName) > -1) {
                let calleeExp = this.transform(node.callee.object);
                if (calleeExp.type && calleeExp.type.collection) {
                    const lambdaExp = this.transformODataLabdaFunc(node, calleeExp.type);
                    return new Expression(`${calleeExp.expression}/${funcName}(${lambdaExp.expression})`, new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Boolean));
                }
            }
            if (node.callee.object.type == "Identifier"
                && this.args[node.callee.object.name] == this.args[2]) {
                let funcMetadatas = oDataQueryFuncs_1.ODataFunctionsMetadata[funcName];
                let argsExprs = node.arguments.map(n => this.transform(n));
                let funcMetadata = null;
                //find func overrides by args
                for (let item of funcMetadatas || []) {
                    if (item.arguments.length == argsExprs.length) {
                        let isEq = true;
                        for (var i = 0; i < item.arguments.length; i++) {
                            const argExp = argsExprs[i];
                            const argType = argExp && argExp.type && argExp.type.type;
                            isEq = item.arguments[i] == argType
                                || argType == undefined
                                || argType == metadata_1.EdmTypes.Unknown;
                            if (!isEq)
                                break;
                        }
                        if (isEq) {
                            funcMetadata = item;
                            break;
                        }
                    }
                }
                if (funcMetadata == null)
                    throw new Error(`Metadata for query function '${funcName}' not found`);
                else {
                    let argStrs = argsExprs.map((e, i) => e.toString(funcMetadata.arguments[i], this.options));
                    return new Expression(`${funcName}(${argStrs.join(",")})`, new metadata_1.EdmTypeReference(funcMetadata.return));
                }
            }
        }
        throw new Error("Allowed call functions only from thrid argument");
    }
    //parse lambda expression
    transformODataLabdaFunc(node, propMetadata) {
        if (node.arguments.length == 1) {
            let scriptLoc = node.arguments[0].loc;
            let script = this.substring(scriptLoc)
                .join("\n");
            script = normalizeScript(script);
            let lambdaNodes = parse(script);
            let context = {};
            for (let arg in this.args) {
                context[arg] = arg == "0"
                    ? { type: propMetadata.type }
                    : this.args[arg];
            }
            let visitor = new Visitor(context, script.split("\n"), true, this.options);
            return visitor.transform(lambdaNodes);
        }
        throw new Error("One argument required for lambda function");
    }
    substring(range) {
        if (range.start.line == range.end.line)
            return [
                this.text[range.start.line - 1]
                    .substring(range.start.column, range.end.column)
            ];
        return this.text
            .map((v, i) => {
            i++;
            if (i < range.start.line || i > range.end.line)
                return "";
            else if (i == range.start.line)
                return v.substring(range.start.column);
            else if (i == range.end.line)
                return v.substring(0, range.end.column);
            else
                return v;
        })
            .filter(v => v != "");
    }
}
//# sourceMappingURL=filterExpressionBuilder.js.map