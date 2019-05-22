import * as ts from "typescript";
import { assert } from "chai";
import * as path from "path";
import { transformExprToStr } from "../pailingualFilterTransform";
import { metadata } from "./models";
import { TestCase } from "./cases";


describe("Transform", function ()
{   
    const testCasesFilePath = path.join(__dirname, "cases.ts");
    
    const compilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2018,
        alwaysStrict: false,
        moduleResolution: ts.ModuleResolutionKind.NodeJs
    };
    const compilerHost = ts.createCompilerHost(compilerOptions)
    const program = ts.createProgram(["index.ts", testCasesFilePath], compilerOptions, compilerHost);
    const sf = program.getSourceFile(testCasesFilePath);
    
    const casesExport = sf.statements.find(s => ts.isExportAssignment(s)) as ts.ExportAssignment;
    const casesArray = (casesExport.expression as any).expression as ts.ArrayLiteralExpression;
    for (let caseNode of casesArray.elements) {
        if (ts.isObjectLiteralExpression(caseNode)) {
            let props = caseNode.properties.reduce<Record<string, string | ts.ArrowFunction>>(
                (p, c) => {
                    if (ts.isPropertyAssignment(c))
                        p[(c.name as ts.Identifier).escapedText.toString()] = ts.isStringLiteral(c.initializer)
                            ? c.initializer.text
                            : c.initializer as ts.ArrowFunction
                    return p;
                }, {}) as Record<keyof TestCase, string | ts.Node>;

//THIS CALL GENERATE TEST CASES
            testTransform(<string>props.name, <ts.ArrowFunction>props.expression, <string>props.expectedTransform);
        }
    }

    function testTransform(name: string, expression: ts.ArrowFunction, expected: string) {
        it(name, () => {
            const transformFactory: ts.TransformerFactory<ts.Node> = ctx => {
                const visitor = (n: ts.Node) => ts.visitEachChild(transformExprToStr(n, program, sf, metadata, ctx), visitor, ctx)
                return visitor;
            };
            var { diagnostics, transformed } =ts.transform(expression.body, [transformFactory]);
            const actual = ts.createPrinter().printNode(ts.EmitHint.Unspecified, transformed[0], sf);
            assert.equal(actual, expected);
            assert.isEmpty(diagnostics, "Transform diagnostics not empty");
        })
    }
});