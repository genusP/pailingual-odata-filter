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
    if (ts.isCallExpression(node)
        && node.arguments.length > 0) {
        const callExp = node.expression;
        const firstArg = node.arguments[0];
        if (callExp.name
            && callExp.name.getText() == "$filter"
            && ts.isArrowFunction(firstArg) || ts.isFunctionDeclaration(firstArg)) {
            const typeChecker = prg.getTypeChecker();
            var arrowFuncParameterType = typeChecker.getTypeAtLocation(firstArg.parameters[0]);
            if (arrowFuncParameterType.aliasTypeArguments
                && arrowFuncParameterType.aliasTypeArguments.length > 0) {
                const EntityInerface = arrowFuncParameterType.aliasTypeArguments[0];
                debugger;
            }
            //const sf = ts.createSourceFile()
            //const converter = new Converter()
        }
    }
    return node;
}
exports.transformExprToStr = transformExprToStr;
//# sourceMappingURL=pailingualFilterTransform.js.map