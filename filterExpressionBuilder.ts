import { csdl, Options, serialization } from "pailingual-odata";
import * as estree from "estree";
import { ODataFunctionsMetadata, QueryFuncMetadata } from "./oDataQueryFuncs";

type ParserDelegate = (fragment: string) => any;

var parse: ParserDelegate;

class FilterExpressionParseError extends Error {
    constructor(message: string, public internalError?: Error) {
        super(message);
    }
}

export function setParser(parser: ParserDelegate) {
    parse = parser;
}

export type ParameterProvider = { type: csdl.ComplexType | csdl.EntityType, getValue: (p: string) => ValueProvider };
export type ValueProvider = (type: csdl.PrimitiveType | csdl.EnumType, options: Options) => any

export function buildExpression(funcOrNodes: Function | estree.Node, params: object | ParameterProvider, metadata: csdl.EntityType, options: Options): string {
    const nodes = typeof funcOrNodes === "function"
        ? getNodes(funcOrNodes)
        : funcOrNodes;
    try {
        return new Visitor(
            {
                "0": { type: metadata, getValue: undefined },
                "1": getParamsMetadata(params)
            },
            false,
            options
        )
            .transform(nodes, metadata)
            .expression;
    }
    catch (e) {
        throw new FilterExpressionParseError(`Unable parse filter expression: ${e.message}`,e );
    }
}

function getNodes(func: Function): estree.Node {
    if (!parse)
        throw new Error("Parser initilization needed. Call setParser().");
    let expressionBody = normalizeScript(func.toString());
    return parse(expressionBody);
}

function normalizeScript(script: string): string {
        return script.replace(/function([^(]*)/, "function p");
}

function getParamsMetadata(params: Record<string, any>): ParameterProvider {
    const definedProps = Object.getOwnPropertyNames(params || {});
    if (definedProps.length == 2 && definedProps.indexOf("type") > -1 && definedProps.indexOf("getValue"))
        return params as ParameterProvider
    let paramsType: csdl.ComplexType = { $Kind: csdl.CsdlKind.ComplexType };
    for (let prop of definedProps) {
        paramsType[prop] = { $Kind: csdl.CsdlKind.Property, $Type: csdl.PrimitiveType.Untyped };
    }
    return {
        type: paramsType,
        getValue(p) {
            const val = params[p];
            return (curType, options) => {
                var res: string | null = null;
                if (Array.isArray(val))
                    res = `(${val.map(v => serialization.serializeValue(v, curType, true, options)).join(',')})`
                else
                    res = serialization.serializeValue(val, curType, true, options);
                return res || this.valueProvider.toString() as string;
            }
        }
    };
}

class Expression {
    constructor(
        public readonly expression: string,
        public readonly type: csdl.EntityType | csdl.ComplexType | csdl.PrimitiveType | csdl.EnumType | undefined,
        private readonly valueProvider?: ValueProvider,
    ) { }

    toString(type: csdl.PrimitiveType | csdl.EntityType | csdl.EnumType | csdl.ComplexType | undefined, options: Options): string {
        if (this.valueProvider != null) {
            let curType = type || this.type;
            if (csdl.isEnumType(curType) || csdl.isPrimitiveType(curType))
                return this.valueProvider(curType, options);
        }
        return this.expression;
    }
}

const lambdaFunctions = ["any", "all"];

class Visitor {
    constructor(
        private args: Record<string, ParameterProvider>,
        private asLambda: boolean,
        private options: Options
    ) {

    }
    transform(node: estree.Expression | estree.Node, metadata?: csdl.EntityType | csdl.ComplexType): Expression {
        const transformName = "transform" + node.type;
        if (transformName in this)
            return (this as any)[transformName](node, metadata);
        throw new Error(`Not supported node type '${node.type}'`);
    }

    transformProgram(node: estree.Program, metadata: csdl.EntityType): Expression {
        if (node.body.length > 1)
            throw new Error("Multiple body nodes not supported");
        return this.transform(node.body[0], metadata);
    }

    transformExpressionStatement(node: estree.ExpressionStatement, metadata: csdl.EntityType): Expression {
        return this.transform(node.expression, metadata);
    }

    transformArrowFunctionExpression(node: estree.ArrowFunctionExpression, metadata: csdl.EntityType): Expression {
        return this.transformFunctionDeclaration(node, metadata);
    }

    transformFunctionDeclaration(node: estree.FunctionDeclaration | estree.ArrowFunctionExpression, metadata: csdl.EntityType): Expression {
        let pos = 0;
        for (let p of node.params) {
            const argName = (p as estree.Identifier).name;
            this.args[argName] = this.args[pos.toString()];
            pos++;
        }
        const exp = this.transform(node.body, metadata);
        if (this.asLambda) {
            const paramName = (node.params[0] as estree.Identifier).name;
            return new Expression(paramName + ":" + exp.expression, exp.type);
        }
        return exp;
    }

    transformBlockStatement(node: estree.BlockStatement, metadata: csdl.EntityType): Expression{
        const body = node.body.filter(n => n.type != "EmptyStatement");
        if (body.length > 1)
            throw new Error("Multiple statement functions not supported");
        return this.transform(body[0], metadata);
    }

    transformReturnStatement(node: estree.ReturnStatement, metadata: csdl.EntityType): Expression {
        if (node.argument)
            return this.transform(node.argument, metadata);
        throw new Error("Return statement needed");
    }

    operatorMap: Record<string, string> = {
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
        "/":"divby"
    };

    transformBinaryExpression(node: estree.BinaryExpression): Expression {
        if (!(node.operator in this.operatorMap))
            throw new Error(`Not supported operator '${node.operator}'`)

        let leftExp = this.transform(node.left);
        let rightExp = this.transform(node.right);

        let curType = leftExp.type || rightExp.type;

        let left = leftExp.toString(curType, this.options);
        let right = rightExp.toString(curType, this.options);

        let resultExprStr = [left, this.operatorMap[node.operator], right].join(" ");

        return new Expression(resultExprStr, curType!);
    }

    transformParenthesizedExpression(node: estree.Node) {
        const exp = this.transform((node as any).expression);
        return new Expression(`(${exp.toString(exp.type, this.options)})`, exp.type)
    }

    transformMemberExpression(node: estree.MemberExpression, metadata: csdl.EntityType | csdl.ComplexType): Expression {
        let parts = new Array<string>();
        let curMetadata = metadata;
        const propertyExp = node.property as estree.Identifier;
        if (node.object.type !== "Identifier") {
            let objExpr = this.transform(node.object, metadata);
            curMetadata = objExpr.type as csdl.EntityType;
            parts.push(objExpr.expression)
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
        let property = csdl.getProperty(propertyExp.name, curMetadata);
        if (!property)
            throw new Error(`Metadata for property '${expression}' not found`);
        let propType = csdl.getType(property.$Type, property)
        return new Expression(expression, propType, value);
    }

    transformLiteral(node: estree.Literal): Expression {
        const v = node.value == null ? "null"
            : node.value.toString();
        return new Expression(v, undefined, (t, o) => serialization.serializeValue(node.value, t, true, o));
    }

    transformArrayExpression(node: estree.ArrayExpression): Expression {
        return new Expression(
            "",
            undefined,
            (t, o) => "(" + node.elements.map(e => this.transform(e).toString(t, o)).join(",")+")"
        )
    }

    transformLogicalExpression(node: estree.LogicalExpression): Expression {
        if (!(node.operator in this.operatorMap))
            throw new Error(`Not supported logical operator '${node.operator}'`);
        let parts = new Array<string>();
        if (node.left)
            parts.push(this.transform(node.left).toString(undefined, this.options));
        parts.push((this.operatorMap as any)[node.operator]);
        parts.push(this.transform(node.right).toString(undefined, this.options));
        return new Expression(parts.join(" "), csdl.PrimitiveType.Boolean);
    }

    transformCallExpression(node: estree.CallExpression): Expression
    {
        if (node.callee.type == "MemberExpression") {
            let funcName = (node.callee.property as estree.Identifier).name;
            if (lambdaFunctions.indexOf(funcName) > -1) {
                let calleeExp = this.transform(node.callee.object);
                //if (calleeExp.type && calleeExp.type.collection) {
                    const lambdaExp = this.transformODataLabdaFunc(node, calleeExp.type);
                    return new Expression(
                        `${calleeExp.expression}/${funcName}(${lambdaExp.expression})`,
                        csdl.PrimitiveType.Boolean
                    );
                //}
            }
            if (node.callee.object.type == "Identifier"
                && this.args[node.callee.object.name] == this.args[2]) {

                let funcMetadatas = ODataFunctionsMetadata[funcName];
                let argsExprs = node.arguments.map(n => this.transform(n));
                let funcMetadata: QueryFuncMetadata | null = null;
                //find func overrides by args
                for (let item of funcMetadatas || []) {
                    if (item.arguments.length == argsExprs.length) {
                        let isEq = true;
                        for (var i = 0; i < item.arguments.length; i++) {
                            const argExp = argsExprs[i];
                            const argType = argExp && argExp.type;
                            isEq = item.arguments[i] == argType
                                || argType == undefined
                                || argType == csdl.PrimitiveType.Untyped
                            if (!isEq) break
                        }
                        if (isEq) {
                            funcMetadata = item;
                            break;
                        }
                    }
                }

                if (funcMetadata == null)
                    throw new Error(`Metadata for query function '${funcName}' not found`)
                else {
                    let argStrs = argsExprs.map((e, i) =>
                        e.toString((funcMetadata as QueryFuncMetadata).arguments[i], this.options)
                    );
                    return new Expression(
                        `${funcName}(${argStrs.join(",")})`,
                        funcMetadata.return
                    );
                }
            }
        }
        throw new Error("Allowed call functions only from thrid argument");
    }

    //parse lambda expression
    transformODataLabdaFunc(node: estree.CallExpression, propMetadata: csdl.ComplexType | csdl.EntityType | csdl.EnumType | csdl.PrimitiveType): Expression {
        if (node.arguments.length == 1) {
            let context: Record<string, any> = {};
            for (let arg in this.args) {
                context[arg] = arg == "0"
                    ? { type: propMetadata }
                    : this.args[arg];
            }
            let visitor = new Visitor(
                context,
                true,
                this.options
            );
            return visitor.transform(node.arguments[0]);
        }
        throw new Error("One argument required for lambda function");
    }
}