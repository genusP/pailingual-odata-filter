import * as ts from "typescript";
import * as estree from "estree";
import { metadata as md } from "pailingual-odata";
import { buildExpression, ParameterProvider } from "./filterExpressionBuilder";
import { EdmEntityType } from "pailingual-odata/dist/esm/metadata";

export default class PailingualFilterTransform {
    tsPrinter = ts.createPrinter();
    readonly odataTypeDeclareRegExp = /\/[*\/]\s*@odata.type\s+(\S+)/;
    diagnostics: ts.Diagnostic[] = [];

    constructor(readonly metadata: md.ApiMetadata) { }

    createTransform(prg: ts.Program): ts.TransformerFactory<ts.SourceFile> {
        return (transformationContext: ts.TransformationContext) => {
            return (file: ts.SourceFile) => this.visitNodeAndChildren(file, { prg, transformationContext, file }) as any;
        }
    }

    visitNodeAndChildren(node: ts.Node, ctx: PailingualTransformationContext): ts.Node {
        node = ts.visitEachChild(node, c => this.visitNodeAndChildren(c, ctx), ctx.transformationContext)
        return this.transformExprToStr(node, ctx);
    }

    transformExprToStr(node: ts.Node, ctx: PailingualTransformationContext): ts.Node {
        if (ts.isArrowFunction(node) || ts.isFunctionDeclaration(node)) {
            const filterExpression = this.getFilterExpression(node, ctx);
            if (filterExpression) {
                const callExpression = ts.isCallExpression(node.parent) && node.parent;
                const entityType = this.getEntityMetadataFromComment(filterExpression, ctx)
                    || (callExpression && this.getEntityMetadataByApiContext(callExpression, ctx));
                if (entityType) {
                    const estreeNode = this.getEstreeNode(filterExpression);
                    const parameterProvider: ParameterProvider = callExpression && this.getParameterProvider(callExpression, ctx)
                    const expr = buildExpression(estreeNode, parameterProvider, entityType, {});
                    const exprNode = ts.createIdentifier('"' + expr + '"');

                    return exprNode;
                }
                else {
                    var diagnostic: ts.Diagnostic = {
                        category: ts.DiagnosticCategory.Error,
                        code: 0,
                        file: ctx.file,
                        start: filterExpression.pos,
                        length: filterExpression.end - filterExpression.pos,
                        messageText: "Unable get EntityTypeMetadata. Expression not converted!"
                    };
                    this.diagnostics.push(diagnostic);
                }
            }
        }
        if (ts.isSourceFile(node) && ctx.needSerializeImportDeclaration == true)
            return this.addImportSerialization(node)
        return node;
    }

    getFilterExpression(node: ts.ArrowFunction | ts.FunctionDeclaration, ctx: PailingualTransformationContext) {
   
        const typeChecker = ctx.prg.getTypeChecker();
        let parameterType: ts.Type = null;

        switch (node.parent.kind) { 
            case ts.SyntaxKind.CallExpression: //parameter
                const callNode = node.parent as ts.CallExpression;
                const callSignature = typeChecker.getResolvedSignature(callNode);
                const parameterSymbol = callSignature.parameters[callNode.arguments.indexOf(node as ts.Expression)];
                parameterType = typeChecker.getTypeAtLocation(parameterSymbol.valueDeclaration);
                break;
            case ts.SyntaxKind.BinaryExpression: //assign to variable
                parameterType = typeChecker.getTypeAtLocation((node.parent as ts.BinaryExpression).left);
                break;
            default:
                parameterType = typeChecker.getTypeAtLocation(node.parent);
        }
        if (parameterType
            && parameterType.aliasSymbol
            && parameterType.aliasSymbol.escapedName == "FilterExpression") {
            return node;
        }
    }

    addImportSerialization(node: ts.SourceFile) {
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

    getEntityMetadataFromComment(node: ts.FunctionDeclaration | ts.ArrowFunction, ctx: PailingualTransformationContext) {
        if (node.parameters && node.parameters.length > 0) {
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
                            .map(r => srcText.substring(r.pos, r.end).match(this.odataTypeDeclareRegExp))
                            .filter(_ => _);
                        //if comment found get EntityType by full name
                        if (commmentMatches && commmentMatches.length > 0) {
                            const metadataRef = commmentMatches[0][1];
                            return this.metadata.getEdmTypeMetadata(metadataRef) as EdmEntityType;
                        }
                    }
                    parent = parent.parent;
                }
            }
        }
        return undefined;
    }

    getEntityMetadataByApiContext(node: ts.Node, ctx: PailingualTransformationContext) {
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
                        entityType = this.metadata.entitySets[propertyName] || this.metadata.singletons[propertyName];
                }
                return visited;
            };
            ts.visitEachChild(node, visitor, ctx.transformationContext);
        }
        catch{ }
        return entityType;
    }

    getEstreeNode(srcNode: ts.ArrowFunction | ts.FunctionDeclaration) {
        const convert = (node: ts.Node): any => {
            switch (node.kind) {
                case ts.SyntaxKind.AmpersandAmpersandToken: return "&&";
                case ts.SyntaxKind.ArrayLiteralExpression:
                    const al = node as ts.ArrayLiteralExpression;
                    return <estree.ArrayExpression>{
                        elements: al.elements.map(e => convert(e)),
                        type: "ArrayExpression"
                    };
                case ts.SyntaxKind.ArrowFunction:
                    const af = node as ts.ArrowFunction;
                    return <estree.ArrowFunctionExpression>{
                        body: convert(af.body),
                        params: af.parameters.map(p => convert(p)),
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
                        type: "BinaryExpression"
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
                        type: "Identifier"
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
                        type: "ParenthesizedExpression"
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

    getParameterProvider(node: ts.CallExpression, ctx: PailingualTransformationContext): ParameterProvider {
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
                const _this = this;
                return {
                    type: edmType,
                    getValue(p: string) {
                        return (type, opt) => {
                            const propertyAssignment = objectLiteral.properties.find((pn: any) => pn.name.text == p);
                            const initializer = ts.isPropertyAssignment(propertyAssignment)
                                ? _this.tsPrinter.printNode(ts.EmitHint.Unspecified, propertyAssignment.initializer, ctx.file)
                                : p;
                            var propertyType = ctx.prg.getTypeChecker().getTypeAtLocation(propertyAssignment);
                            var metadataType = _this.getValueMetadataType(type, node, ctx);
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

    getValueMetadataType(type: md.EdmTypes | md.EdmEnumType, node: ts.CallExpression, ctx: PailingualTransformationContext) {
        if (type instanceof md.EdmEnumType) {
            let rootExpression = node.expression;
            while ((rootExpression as any).expression) {
                rootExpression = (rootExpression as any).expression;
            }
            const expressionString = this.tsPrinter.printNode(ts.EmitHint.Unspecified, rootExpression, ctx.file);
            const enumFullName = type.getFullName();
            return `${expressionString}.__apiMetadata.getEdmTypeMetadata(\"${enumFullName}\")`;
        }
        else
            return '"' + type.toString() + '"';
    }

    notTransfomedError() {
        return new NonTransformErrorPlugin(this);
    }
}

import { Compiler } from "webpack";

class NonTransformErrorPlugin{
    constructor(private transform: PailingualFilterTransform) {
    }

    apply(compiler: Compiler) {
        compiler.hooks.afterEmit.tap("NonTransformErrorPlugin", compilation => {
            compilation.errors.push(
                ...this.transform.diagnostics.map(this.diagnosticToString)
            )
        })
    }

    diagnosticToString(diagnostic: ts.Diagnostic): string
    {
        let res = "";
        if (diagnostic.file) {
            const path = require("path");
            const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            const fileName = path.relative(".", diagnostic.file.fileName);

            res =`${fileName}:${pos.line+1}:${pos.character+1}\r\n`;
        }
        res += `\t${diagnostic.messageText}\r\n`;
        return res;
    }
}

type PailingualTransformationContext = {
    file: ts.SourceFile,
    needSerializeImportDeclaration?: boolean,
    prg: ts.Program,
    transformationContext: ts.TransformationContext
};

export { PailingualFilterTransform };