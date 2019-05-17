import * as ts from "typescript";

export default function (program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        return (file: ts.SourceFile) => visitNodeAndChildren(file, program, context) as any;
    }
}

function visitNodeAndChildren(node: ts.Node, prg: ts.Program, ctx: ts.TransformationContext): ts.Node {
    return ts.visitEachChild(transformExprToStr(node, prg), c => visitNodeAndChildren(c, prg, ctx), ctx)
}

export function transformExprToStr(node: ts.Node, prg: ts.Program): ts.Node {
    if(ts.isCallExpression(node)) {
        debugger;
    }
    return node;
}