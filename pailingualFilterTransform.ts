import * as ts from "typescript";
import * as estree from "estree";
import { metadata } from "pailingual-odata";
import { buildExpression } from "./filterExpressionBuilder";

export default function (metadata: metadata.ApiMetadata) {
    return (program: ts.Program): ts.TransformerFactory<ts.SourceFile> =>{
        return (context: ts.TransformationContext) => {
            return (file: ts.SourceFile) => visitNodeAndChildren(file, program, file, metadata, context) as any;
        }
    }
}

function visitNodeAndChildren(node: ts.Node, prg: ts.Program, sf: ts.SourceFile, metadata: metadata.ApiMetadata, ctx: ts.TransformationContext): ts.Node {
    return ts.visitEachChild(transformExprToStr(node, prg, sf, metadata, ctx), c => visitNodeAndChildren(c, prg, sf, metadata, ctx), ctx)
}

export function transformExprToStr(node: ts.Node, prg: ts.Program, sf: ts.SourceFile, metadata: metadata.ApiMetadata, ctx: ts.TransformationContext): ts.Node {
    if (ts.isCallExpression(node)
        && node.arguments.length > 0)
    {
        const callExp: any = node.expression;
        const firstArg = node.arguments[0];
        if (callExp.name
            && callExp.name.text == "$filter"
            && ts.isArrowFunction(firstArg) || ts.isFunctionDeclaration(firstArg)
        ) {
            const entityType = getEntityMetadata(node.expression, prg, metadata, ctx);
            const estreeNode = getEstreeNode(firstArg);
            var expr = buildExpression(estreeNode, null, entityType, {});
            return ts.updateCall(
                node,
                node.expression,
                node.typeArguments,
                [ts.createStringLiteral(expr)]
            );
        }
    }
    return node;
}

function getEntityMetadata(node: ts.Node, prg: ts.Program, metadata: metadata.ApiMetadata, ctx: ts.TransformationContext) {
    const typeChecker = prg.getTypeChecker();
    let entityType: metadata.EdmEntityType;
    try {
        const visitor = node2 => {
            var type = typeChecker.getTypeAtLocation(node2);
            if (type.aliasSymbol
                && type.aliasSymbol.name == "ApiContext"
                && (type.aliasSymbol as any).parent.escapedName.match(/\/pailingual-odata\/[\w\/]+\/index["']?$/)
            ) {
                return node2;
            }
            const visited = ts.visitEachChild(node2, visitor, ctx);

            if (ts.isPropertyAccessExpression(node2)) {
                const propertyName = node2.name.getText();
                if (entityType) {
                    const typeRef = entityType.navProperties[propertyName] || entityType.properties[propertyName]
                    entityType = typeRef!.type as metadata.EdmEntityType
                }
                else
                    entityType = metadata.entitySets[propertyName] || metadata.singletons[propertyName];
            }
            return visited;
        };
        ts.visitEachChild(node, visitor, ctx);
    }
    catch{ }
    return entityType;
}

function getEstreeNode(srcNode: ts.ArrowFunction | ts.FunctionDeclaration) {
    const convert = (node: ts.Node): any => {
        switch (node.kind) {
            case ts.SyntaxKind.ArrowFunction:
                const af = node as ts.ArrowFunction;
                return <estree.ArrowFunctionExpression>{
                    body: convert(af.body),
                    params: af.parameters.map(p=>convert(p)),
                    type: "ArrowFunctionExpression"
                }
            case ts.SyntaxKind.FunctionDeclaration:
                const fd = node as ts.FunctionDeclaration;
                return <estree.FunctionDeclaration>{
                    body: convert(af.body),
                    params: fd.parameters.map(p => convert(p)),
                    type: "FunctionDeclaration"
                };
            case ts.SyntaxKind.Parameter:
                const param = node as ts.ParameterDeclaration;
                return convert(param.name);
            case ts.SyntaxKind.PropertyAccessExpression:
                const pae = node as ts.PropertyAccessExpression;
                return <estree.MemberExpression>{
                    object: convert(pae.expression),
                    property: convert(pae.name),
                    type: "MemberExpression"
                };
            case ts.SyntaxKind.Identifier:
                const i = node as ts.Identifier;
                return <estree.Identifier>{
                    name: i.text,
                    type:"Identifier"
                };
            case ts.SyntaxKind.BinaryExpression:
                const be = node as ts.BinaryExpression;
                return <estree.BinaryExpression>{
                    left: convert(be.left),
                    operator: convert(be.operatorToken),
                    right: convert(be.right),
                    type:"BinaryExpression"
                }
            case ts.SyntaxKind.NumericLiteral:
                const nl = node as ts.NumericLiteral;
                return <estree.Literal>{
                    raw: nl.text,
                    value: parseFloat(nl.text),
                    type: "Literal"
                };
            case ts.SyntaxKind.StringLiteral:
                const sl = node as ts.LiteralExpression;
                return <estree.Literal>{
                    raw: sl.text,
                    value: sl.text,
                    type: "Literal"
                };
            case ts.SyntaxKind.NullKeyword:
                return <estree.Literal>{
                    raw: null,
                    value: null,
                    type: "Literal"
                };
            case ts.SyntaxKind.TrueKeyword:
                return <estree.Literal>{
                    raw: "true",
                    value: true,
                    type: "Literal"
                };
            case ts.SyntaxKind.FalseKeyword:
                return <estree.Literal>{
                    raw: "false",
                    value: false,
                    type: "Literal"
                };
            case ts.SyntaxKind.ParenthesizedExpression:
                const pe = node as ts.ParenthesizedExpression;
                return {
                    expression: convert(pe.expression),
                    type:"ParenthesizedExpression"
                }
            case ts.SyntaxKind.AsExpression:
                const ase = node as ts.AsExpression;
                return convert(ase.expression);
            case ts.SyntaxKind.BarBarToken: return "||";
            case ts.SyntaxKind.AmpersandAmpersandToken: return "&&";
            case ts.SyntaxKind.EqualsEqualsToken: return "==";
            case ts.SyntaxKind.ExclamationEqualsToken: return "!=";
            case ts.SyntaxKind.EqualsEqualsEqualsToken: return "===";
            case ts.SyntaxKind.ExclamationEqualsEqualsToken: return "!==";
            case ts.SyntaxKind.LessThanToken: return "<";
            case ts.SyntaxKind.LessThanEqualsToken: return "<=";
            case ts.SyntaxKind.GreaterThanToken: return ">";
            case ts.SyntaxKind.GreaterThanEqualsToken: return ">=";
            case ts.SyntaxKind.PlusToken: return "+";
            case ts.SyntaxKind.MinusToken: return "-";
            case ts.SyntaxKind.AsteriskToken: return "*";
            case ts.SyntaxKind.SlashToken: return "/";
            case ts.SyntaxKind.PercentToken: return "%";
            default:
                throw new Error(`Not supported syntax kind: ${ts.SyntaxKind[node.kind]}`);
        }
    };
    return convert(srcNode) as estree.Node;
}