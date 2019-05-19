import * as ts from "typescript";
import { assert } from "chai";
import pailingualFilterTransform from "../pailingualFilterTransform"


describe("Pailingual filter expression transform", () => {
    testTransform("1", "e=>e.field == '1'", "\"field eq '1'\"");
});
function testTransform(name: string, filterExpr: string, expectedExpr: string) {
    it(name, async () => {
        const actual = await emitJs(filterExpr);
        const expected = `function test() {\r\n    ({}.entities.$filter(${expectedExpr}));\r\n}\r\n`;
        assert.equal(actual, expected);
    })
}

const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2018,
    alwaysStrict: false,
    moduleResolution: ts.ModuleResolutionKind.NodeJs
};
const compilerHost = ts.createCompilerHost(compilerOptions)

function emitJs(filterExpr: string) {
    const program = ts.createProgram(["index.ts","tests/template.ts"], compilerOptions, compilerHost)
    return new Promise<string>((resolve, reject) =>
        program.emit(
            undefined,
            (fn: string, data: string, wbom: boolean, one) => {
                if (fn.endsWith("tests/template.js"))
                resolve(data)
            },
            undefined,
            undefined,
            {
                before: [
                    setExpression(filterExpr),
                    () => sf => { console.log(ts.createPrinter().printFile(sf)); return sf },
                    pailingualFilterTransform(program)
                ]
            }
        )
    )
        .then(_ => { 
            const allDiagnostics = program.getGlobalDiagnostics()
                .concat(program.getOptionsDiagnostics())
                .concat(program.getSyntacticDiagnostics())
                .concat(program.getSemanticDiagnostics())
                .concat(program.getDeclarationDiagnostics());
            if (allDiagnostics.length == 0)
                return Promise.resolve(_);
            else
                return Promise.reject(
                    allDiagnostics.map(diagnostic => {
                        var res = "";
                        if (diagnostic.file) {
                            const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                            const fileName = diagnostic.file.fileName;

                            res = `${fileName}:${pos.line}:${pos.character} `;
                        }

                        res += `${ts.DiagnosticCategory[diagnostic.category]} TS${diagnostic.code}: ${diagnostic.messageText}`;
                    })
                );
        });
}

function setExpression(expr: string) {
    function visitor(ctx: ts.TransformationContext, sf: ts.SourceFile) {
        const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
            if (ts.isCallExpression(node)&& node.arguments.length == 1) {
                const firstArg = node.arguments[0];
                if (ts.isStringLiteral(firstArg) && firstArg.text === "PLACE-HOLDER") {
                    //get nodes from string expression
                    var callNode = ts.createSourceFile("", `a(${expr})`, ts.ScriptTarget.ES2018, true, ts.ScriptKind.TS).getChildren()[0].getChildren()[0] as any;
                    var args = callNode.expression.arguments
                        .map(_ => {
                            //remove position info from nodes
                            const cleanPos = (n2: ts.Node) => {
                                n2.pos = -1;
                                n2.end = -1;
                                return ts.visitEachChild(n2, cleanPos, ctx)
                            };
                            return cleanPos(ts.getMutableClone(_));
                        });
                    //replace placeholder to new nodes
                    return ts.updateCall(node, node.expression, node.typeArguments, args);
                }
            }
            return ts.visitEachChild(node, visitor, ctx)
        }
        return visitor
    }
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => ts.visitNode(sf, visitor(ctx, sf))
    }
}