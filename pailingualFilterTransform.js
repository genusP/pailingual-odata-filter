"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
function default_1(program) {
    return (context) => {
        return (file) => visitNodeAndChildren(file, program, context);
    };
}
exports.default = default_1;
function visitNodeAndChildren(node, prg, ctx) {
    return ts.visitEachChild(transformExprToStr(node, prg), c => visitNodeAndChildren(c, prg, ctx), ctx);
}
function transformExprToStr(node, prg) {
    if (ts.isCallExpression(node)) {
        debugger;
    }
    return node;
}
exports.transformExprToStr = transformExprToStr;
//# sourceMappingURL=pailingualFilterTransform.js.map