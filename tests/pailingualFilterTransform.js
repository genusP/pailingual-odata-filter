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
describe("Pailingual filter expression transform", () => {
    const compilerOptions = {};
    const compilerHost = ts.createCompilerHost(compilerOptions);
    const msgs = {};
    it("1", () => __awaiter(this, void 0, void 0, function* () {
        const program = ts.createProgram(["tests/template.ts"], compilerOptions, compilerHost);
        var e = yield new Promise((resolve, reject) => program.emit(undefined, (fn, data, wbom, one) => {
            resolve(data);
        }, undefined, undefined, {
            before: [setExpression("e=>e.field == '1'")]
        }));
        chai_1.assert.equal("", "");
    }));
});
function setExpression(expr) {
    function visitor(ctx, sf) {
        const visitor = (node) => {
            if (ts.isCallExpression(node) && node.arguments.length == 1) {
                const firstArg = node.arguments[0];
                if (ts.isStringLiteral(firstArg) && firstArg.text === "PLACE-HOLDER") {
                    var callNode = ts.createSourceFile("", `a(${expr})`, ts.ScriptTarget.ES2018, true, ts.ScriptKind.TS).getChildren()[0].getChildren()[0];
                    var args = callNode.expression.arguments.map(_ => ts.getMutableClone(_));
                    return ts.updateCall(node, node.expression, node.typeArguments, args);
                }
            }
            // here we can check each node and potentially return 
            // new nodes if we want to leave the node as is, and 
            // continue searching through child nodes:
            return ts.visitEachChild(node, visitor, ctx);
        };
        return visitor;
    }
    return (ctx) => {
        return (sf) => ts.visitNode(sf, visitor(ctx, sf));
    };
}
//# sourceMappingURL=pailingualFilterTransform.js.map