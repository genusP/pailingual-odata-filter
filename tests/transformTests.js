"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const chai_1 = require("chai");
const pailingualFilterTransform_1 = require("../pailingualFilterTransform");
describe("Pailingual filter expression transform", () => {
    testTransform("1", "e=>e.field == '1'", "\"field eq '1'\"");
});
function testTransform(name, filterExpr, expectedExpr) {
    it(name, () => __awaiter(this, void 0, void 0, function* () {
        const actual = yield emitJs(filterExpr);
        const expected = `function test() {\r\n    ({}.entities.$filter(${expectedExpr}));\r\n}\r\n`;
        chai_1.assert.equal(actual, expected);
    }));
}
const compilerOptions = {
    target: ts.ScriptTarget.ES2018,
    alwaysStrict: false,
    moduleResolution: ts.ModuleResolutionKind.NodeJs
};
const compilerHost = ts.createCompilerHost(compilerOptions);
function emitJs(filterExpr) {
    const program = ts.createProgram(["index.ts", "tests/template.ts"], compilerOptions, compilerHost);
    return new Promise((resolve, reject) => program.emit(undefined, (fn, data, wbom, one) => {
        if (fn.endsWith("tests/template.js"))
            resolve(data);
    }, undefined, undefined, {
        before: [
            setExpression(filterExpr),
            () => sf => { console.log(ts.createPrinter().printFile(sf)); return sf; },
            pailingualFilterTransform_1.default(program)
        ]
    }))
        .then(_ => {
        const allDiagnostics = program.getGlobalDiagnostics()
            .concat(program.getOptionsDiagnostics())
            .concat(program.getSyntacticDiagnostics())
            .concat(program.getSemanticDiagnostics())
            .concat(program.getDeclarationDiagnostics());
        if (allDiagnostics.length == 0)
            return Promise.resolve(_);
        else
            return Promise.reject(allDiagnostics.map(diagnostic => {
                var res = "";
                if (diagnostic.file) {
                    const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                    const fileName = diagnostic.file.fileName;
                    res = `${fileName}:${pos.line}:${pos.character} `;
                }
                res += `${ts.DiagnosticCategory[diagnostic.category]} TS${diagnostic.code}: ${diagnostic.messageText}`;
            }));
    });
}
function setExpression(expr) {
    function visitor(ctx, sf) {
        const visitor = (node) => {
            if (ts.isCallExpression(node) && node.arguments.length == 1) {
                const firstArg = node.arguments[0];
                if (ts.isStringLiteral(firstArg) && firstArg.text === "PLACE-HOLDER") {
                    //get nodes from string expression
                    var callNode = ts.createSourceFile("", `a(${expr})`, ts.ScriptTarget.ES2018, true, ts.ScriptKind.TS).getChildren()[0].getChildren()[0];
                    var args = callNode.expression.arguments
                        .map(_ => {
                        //remove position info from nodes
                        const cleanPos = (n2) => {
                            n2.pos = -1;
                            n2.end = -1;
                            return ts.visitEachChild(n2, cleanPos, ctx);
                        };
                        return cleanPos(ts.getMutableClone(_));
                    });
                    //replace placeholder to new nodes
                    return ts.updateCall(node, node.expression, node.typeArguments, args);
                }
            }
            return ts.visitEachChild(node, visitor, ctx);
        };
        return visitor;
    }
    return (ctx) => {
        return (sf) => ts.visitNode(sf, visitor(ctx, sf));
    };
}
//# sourceMappingURL=transformTests.js.map