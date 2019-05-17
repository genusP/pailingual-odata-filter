import * as ts from "typescript";
import { assert } from "chai";
import { create } from "domain";
import { CallExpression } from "estree";

describe("Pailingual filter expression transform", () => {
    const compilerOptions: ts.CompilerOptions = {};
    const compilerHost = ts.createCompilerHost(compilerOptions)
    const msgs = {}
    it("1", async () => {
        const program = ts.createProgram(["tests/template.ts"], compilerOptions, compilerHost)
        var e = await new Promise<string>((resolve, reject) =>
            program.emit(
                undefined,
                (fn: string, data: string, wbom: boolean, one) => {
                    resolve(data)
                },
                undefined,
                undefined,
                {
                    before: [setExpression("e=>e.field == '1'")]
                }
            )
        );

        assert.equal("", "");
    })
});

function setExpression(expr: string) {
    function visitor(ctx: ts.TransformationContext, sf: ts.SourceFile) {
        const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
            if (ts.isCallExpression(node)&& node.arguments.length == 1) {
                const firstArg = node.arguments[0];
                if (ts.isStringLiteral(firstArg) && firstArg.text === "PLACE-HOLDER") {
                    var callNode = ts.createSourceFile("", `a(${expr})`, ts.ScriptTarget.ES2018, true, ts.ScriptKind.TS).getChildren()[0].getChildren()[0] as any;
                    var args = callNode.expression.arguments.map(_ => ts.getMutableClone(_));
                    return ts.updateCall(node, node.expression, node.typeArguments, args);
                }
            }
            // here we can check each node and potentially return 
            // new nodes if we want to leave the node as is, and 
            // continue searching through child nodes:
            return ts.visitEachChild(node, visitor, ctx)
        }
        return visitor
    }
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => ts.visitNode(sf, visitor(ctx, sf))
    }
}