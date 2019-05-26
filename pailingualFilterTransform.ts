import * as ts from "typescript";
import * as estree from "estree";
import { metadata as md, metadata } from "pailingual-odata";
import { buildExpression, ParameterProvider } from "./filterExpressionBuilder";
import { EdmEntityType } from "pailingual-odata/dist/esm/metadata";

export default function (metadata: md.ApiMetadata) {
    return (prg: ts.Program): ts.TransformerFactory<ts.SourceFile> =>{
        return (transformationContext: ts.TransformationContext) => {
            return (file: ts.SourceFile) => visitNodeAndChildren(file, { prg, metadata, transformationContext, file }) as any;
        }
    }
}

type PailingualTransformationContext = {
    file: ts.SourceFile,
    needSerializeImportDeclaration?: boolean,
    prg: ts.Program,
    metadata: md.ApiMetadata,
    transformationContext: ts.TransformationContext
};

function visitNodeAndChildren(node: ts.Node, ctx: PailingualTransformationContext): ts.Node {
    node = ts.visitEachChild(node, c => visitNodeAndChildren(c, ctx), ctx.transformationContext)
    return transformExprToStr(node, ctx);
}

export function transformExprToStr(node: ts.Node, ctx: PailingualTransformationContext): ts.Node {
    if (ts.isCallExpression(node)
        && node.arguments.length > 0)
    {
        const callExp: any = node.expression;
        const firstArg = node.arguments[0];
        if (callExp.name
            && callExp.name.text == "$filter"
            && ts.isArrowFunction(firstArg) || ts.isFunctionDeclaration(firstArg)
        ) {
            const entityType = getEntityMetadataFromComment(firstArg, ctx)
                || getEntityMetadataByApiContext(node.expression, ctx);
            if (entityType) {
                const estreeNode = getEstreeNode(firstArg);
                let parameterProvider: ParameterProvider = getParameterProvider(node, ctx)
                var expr = buildExpression(estreeNode, parameterProvider, entityType, {});
                return ts.updateCall(
                    node,
                    node.expression,
                    node.typeArguments,
                    [ts.createIdentifier('"' + expr + '"')]
                );
            }
            else {
                var diagnostic: ts.Diagnostic = {
                    category: ts.DiagnosticCategory.Warning,
                    code: 0,
                    file: ctx.file,
                    start: firstArg.pos,
                    length: firstArg.end - firstArg.pos,
                    messageText: "Unable get EntityTypeMetadata. Expression not converted!"
                };
                (ctx.transformationContext as any).addDiagnostic(diagnostic);
            }
        }
    }
    if (ts.isSourceFile(node) && ctx.needSerializeImportDeclaration == true) 
        return addImportSerialization(node)
    return node;
}

var odataTypeDeclareRegExp = /\/[*\/]\s*@odata.type\s+(\S+)/

function addImportSerialization(node: ts.SourceFile) {
    let isAdded = false, updated = false;
    const importName = "serialization";
    const importSpecifier = ts.createImportSpecifier(undefined, ts.createIdentifier(importName));
    let updatedStatements = [...ts.visitNodes(node.statements,
        n => {
            if (ts.isImportDeclaration(n)
                && ts.isStringLiteral(n.moduleSpecifier)
                && n.moduleSpecifier.text.toLowerCase() == "pailingual-odata") {
                isAdded = true;
                let namedImports = n.importClause.namedBindings as ts.NamedImports;
                if (!namedImports)
                    namedImports = ts.createNamedImports([importSpecifier]);
                else if (!namedImports.elements.find(nb => (nb.propertyName || nb.name).text === importName))
                    namedImports = ts.updateNamedImports(namedImports, [...namedImports.elements, importSpecifier]);
                else
                    return n;
                updated = true;
                return ts.updateImportDeclaration(
                    n,
                    n.decorators,
                    n.modifiers,
                    ts.updateImportClause(
                        n.importClause,
                        n.importClause.name,
                        namedImports
                    ),
                    n.moduleSpecifier
                );
            }
            return n;
        }
    )];
    if (!isAdded) {
        const importDeclaration = ts.createImportDeclaration(
            undefined,
            undefined,
            ts.createImportClause(
                undefined,
                ts.createNamedImports([importSpecifier])
            ),
            ts.createStringLiteral("pailingual-odata")
        )
        updatedStatements.splice(0, 0, importDeclaration);
        updated = true;
    }
    if (updated)
        return ts.updateSourceFileNode(node, updatedStatements)
    return node;
}

function getEntityMetadataFromComment(node: ts.FunctionDeclaration | ts.ArrowFunction, ctx: PailingualTransformationContext) {
    if (node.parameters.length > 0) {
        const typeChecker = ctx.prg.getTypeChecker();
        const sourceType = typeChecker.getTypeAtLocation(node.parameters[0]); //get type of first parametr of filter expression
        if (sourceType && sourceType.aliasTypeArguments) {
            const entityType = sourceType.aliasTypeArguments[0]; //get type entity (FilterSource<TEntity>)
            const typeDeclaraton = entityType.symbol.declarations[0]; //get type declaration node
            let parent: ts.Node = typeDeclaraton.parent;
            while (parent) {
                if (ts.isSourceFile(parent)) { //find source file contains type declaration
                    const srcText = parent.getText();
                    //get declaration leading comments match with regular expression
                    const commmentRanges = ts.getLeadingCommentRanges(srcText, typeDeclaraton.getFullStart());
                    const commmentMatches = commmentRanges && commmentRanges
                        .map(r => srcText.substring(r.pos, r.end).match(odataTypeDeclareRegExp))
                        .filter(_ => _);
                    //if comment found get EntityType by full name
                    if (commmentMatches && commmentMatches.length > 0) {
                        const metadataRef = commmentMatches[0][1];
                        return ctx.metadata.getEdmTypeMetadata(metadataRef) as EdmEntityType;
                    }
                }
                parent = parent.parent;
            }
        }
    }
    return undefined;
}

function getEntityMetadataByApiContext(node: ts.Node, ctx: PailingualTransformationContext) {
    const typeChecker = ctx.prg.getTypeChecker();
    let entityType: md.EdmEntityType;
    try {
        const visitor = node2 => {
            var type = typeChecker.getTypeAtLocation(node2);
            if (type.aliasSymbol
                && type.aliasSymbol.name == "ApiContext"
                && (type.aliasSymbol as any).parent.escapedName.match(/\/pailingual-odata\/[\w\/]+\/index["']?$/)
            ) {
                return node2;
            }
            const visited = ts.visitEachChild(node2, visitor, ctx.transformationContext);

            if (ts.isPropertyAccessExpression(node2)) {
                const propertyName = node2.name.getText();
                if (entityType) {
                    const typeRef = entityType.navProperties[propertyName] || entityType.properties[propertyName]
                    entityType = typeRef!.type as md.EdmEntityType
                }
                else
                    entityType = ctx.metadata.entitySets[propertyName] || ctx.metadata.singletons[propertyName];
            }
            return visited;
        };
        ts.visitEachChild(node, visitor, ctx.transformationContext);
    }
    catch{ }
    return entityType;
}

function getEstreeNode(srcNode: ts.ArrowFunction | ts.FunctionDeclaration) {
    const convert = (node: ts.Node): any => {
        switch (node.kind) {
            case ts.SyntaxKind.AmpersandAmpersandToken: return "&&";
            case ts.SyntaxKind.ArrayLiteralExpression:
                const al = node as ts.ArrayLiteralExpression;
                return <estree.ArrayExpression>{
                    elements: al.elements.map(e => convert(e)),
                    type:"ArrayExpression"
                };
            case ts.SyntaxKind.ArrowFunction:
                const af = node as ts.ArrowFunction;
                return <estree.ArrowFunctionExpression>{
                    body: convert(af.body),
                    params: af.parameters.map(p=>convert(p)),
                    type: "ArrowFunctionExpression"
                }
            case ts.SyntaxKind.AsExpression:
                const ase = node as ts.AsExpression;
                return convert(ase.expression);
            case ts.SyntaxKind.AsteriskToken: return "*";
            case ts.SyntaxKind.BarBarToken: return "||";
            case ts.SyntaxKind.BinaryExpression:
                const be = node as ts.BinaryExpression;
                return <estree.BinaryExpression>{
                    left: convert(be.left),
                    operator: convert(be.operatorToken),
                    right: convert(be.right),
                    type:"BinaryExpression"
                }
            case ts.SyntaxKind.CallExpression:
                const ce = node as ts.CallExpression;
                return <estree.CallExpression>{
                    arguments: ce.arguments.map(a => convert(a)),
                    callee: convert(ce.expression),
                    type: "CallExpression"
                };
            case ts.SyntaxKind.EqualsEqualsToken: return "==";
            case ts.SyntaxKind.ExclamationEqualsToken: return "!=";
            case ts.SyntaxKind.EqualsEqualsEqualsToken: return "===";
            case ts.SyntaxKind.ExclamationEqualsEqualsToken: return "!==";
            case ts.SyntaxKind.FalseKeyword:
                return <estree.Literal>{
                    raw: "false",
                    value: false,
                    type: "Literal"
                };
            case ts.SyntaxKind.FunctionDeclaration:
                const fd = node as ts.FunctionDeclaration;
                return <estree.FunctionDeclaration>{
                    body: convert(af.body),
                    params: fd.parameters.map(p => convert(p)),
                    type: "FunctionDeclaration"
                };
            case ts.SyntaxKind.GreaterThanToken: return ">";
            case ts.SyntaxKind.GreaterThanEqualsToken: return ">=";
            case ts.SyntaxKind.Identifier:
                const i = node as ts.Identifier;
                return <estree.Identifier>{
                    name: i.text,
                    type:"Identifier"
                };
            case ts.SyntaxKind.InKeyword: return "in";
            case ts.SyntaxKind.LessThanToken: return "<";
            case ts.SyntaxKind.LessThanEqualsToken: return "<=";
            case ts.SyntaxKind.MinusToken: return "-";
            case ts.SyntaxKind.NullKeyword:
                return <estree.Literal>{
                    raw: null,
                    value: null,
                    type: "Literal"
                };
            case ts.SyntaxKind.NumericLiteral:
                const nl = node as ts.NumericLiteral;
                return <estree.Literal>{
                    raw: nl.text,
                    value: parseFloat(nl.text),
                    type: "Literal"
                };
            case ts.SyntaxKind.Parameter:
                const param = node as ts.ParameterDeclaration;
                return convert(param.name);
            case ts.SyntaxKind.ParenthesizedExpression:
                const pe = node as ts.ParenthesizedExpression;
                return {
                    expression: convert(pe.expression),
                    type:"ParenthesizedExpression"
                }
            case ts.SyntaxKind.PercentToken: return "%";
            case ts.SyntaxKind.PlusToken: return "+";
            case ts.SyntaxKind.PropertyAccessExpression:
                const pae = node as ts.PropertyAccessExpression;
                return <estree.MemberExpression>{
                    object: convert(pae.expression),
                    property: convert(pae.name),
                    type: "MemberExpression"
                };
            case ts.SyntaxKind.SlashToken: return "/";
            case ts.SyntaxKind.StringLiteral:
                const sl = node as ts.LiteralExpression;
                return <estree.Literal>{
                    raw: sl.text,
                    value: sl.text,
                    type: "Literal"
                };
            case ts.SyntaxKind.TrueKeyword:
                return <estree.Literal>{
                    raw: "true",
                    value: true,
                    type: "Literal"
                };
            default:
                throw new Error(`Not supported syntax kind: ${ts.SyntaxKind[node.kind]}`);
        }
    };
    return convert(srcNode) as estree.Node;
}

var tsPrinter = ts.createPrinter();
function getParameterProvider(node: ts.CallExpression, ctx: PailingualTransformationContext): ParameterProvider {
    if (node.arguments.length == 2) {
        const objectLiteral = node.arguments[1];
        if (ts.isObjectLiteralExpression(objectLiteral)) {
            const edmType = new md.EdmEntityType(
                "Params",
                objectLiteral.properties.reduce<Record<string, md.EdmTypeReference>>((p, c: any) => {
                    p[c.name.text] = new md.EdmTypeReference(md.EdmTypes.Unknown);
                    return p;
                }, {})
            );

            return {
                type: edmType,
                getValue(p: string) {
                    return (type, opt) => {
                        const propertyAssignment = objectLiteral.properties.find((pn: any) => pn.name.text == p);
                        const initializer = ts.isPropertyAssignment(propertyAssignment)
                            ? tsPrinter.printNode(ts.EmitHint.Unspecified, propertyAssignment.initializer, ctx.file)
                            : p;
                        var propertyType = ctx.prg.getTypeChecker().getTypeAtLocation(propertyAssignment);
                        var metadataType = getValueMetadataType(type, node, ctx);
                        if (propertyType.symbol && propertyType.symbol.name == "Array")
                            return `("+${initializer}.map(e=>serialization.serializeValue(e, ${metadataType}, true))+")`;
                        else
                            return `"+serialization.serializeValue(${initializer}, ${metadataType}, true)+"`;
                    }
                }
            }
        }
    }
    return null;
}

function getValueMetadataType(type: md.EdmTypes | md.EdmEnumType, node: ts.CallExpression, ctx: PailingualTransformationContext) {
    if (type instanceof md.EdmEnumType) {
        let rootExpression = node.expression;
        while ((rootExpression as any).expression) {
            rootExpression = (rootExpression as any).expression;
        }
        const expressionString = tsPrinter.printNode(ts.EmitHint.Unspecified, rootExpression, ctx.file);
        const enumFullName = type.getFullName();
        return `${expressionString}.__apiMetadata.getEdmTypeMetadata(\"${enumFullName}\")`;
    }
    else
        return '"'+ type.toString()+'"';
}