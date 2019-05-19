import * as ts from "typescript";
import { Converter } from "@typescript-eslint/typescript-estree/dist/convert";

export default function (program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        return (file: ts.SourceFile) => visitNodeAndChildren(file, program, context) as any;
    }
}

function visitNodeAndChildren(node: ts.Node, prg: ts.Program, ctx: ts.TransformationContext): ts.Node {
    return ts.visitEachChild(transformExprToStr(node, prg), c => visitNodeAndChildren(c, prg, ctx), ctx)
}

export function transformExprToStr(node: ts.Node, prg: ts.Program): ts.Node {
    if (ts.isCallExpression(node)
        && node.arguments.length > 0)
    {
        const callExp: any = node.expression;
        const firstArg = node.arguments[0];
        if (callExp.name
            && callExp.name.getText() == "$filter"
            && ts.isArrowFunction(firstArg) || ts.isFunctionDeclaration(firstArg)
        ) {
            const typeChecker = prg.getTypeChecker();
            var arrowFuncParameterType = typeChecker.getTypeAtLocation(firstArg.parameters[0]);
            if (arrowFuncParameterType.aliasTypeArguments
                && arrowFuncParameterType.aliasTypeArguments.length > 0)
            {
                const EntityInerface = arrowFuncParameterType.aliasTypeArguments[0];
            debugger;

            }
            //const sf = ts.createSourceFile()
            //const converter = new Converter()
        }
    }
    return node;
}