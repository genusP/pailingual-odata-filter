"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const acorn_1 = require("acorn");
const filterExpressionBuilder_1 = require("./filterExpressionBuilder");
const collectionSource_1 = require("pailingual-odata/src/collectionSource");
// add support filter expressions to CollectionSource
function $filter(base, expr, params) {
    if (typeof expr === "function") {
        const q = this.query.filter({ func: expr, params });
        return new collectionSource_1.CollectionSource(this.__metadata, this.__apiMetadata, q);
    }
    return base(expr);
}
// override process filter parameter in Query
function processParametr(base, name, value, opt) {
    if (name == "filter")
        value = value.map((v) => filterToString.apply(this, [v, opt]));
    return base(name, value, opt);
}
function filterToString(expr, options) {
    if (typeof expr === "string")
        return expr;
    else
        return filterExpressionBuilder_1.buildExpression(expr.func, expr.params || {}, this._entityMetadata, options);
}
//define plugin
exports.default = {
    register() {
        filterExpressionBuilder_1.setParser(f => acorn_1.parse(f, { locations: true }));
        return {
            collectionSourceFn: { $filter },
            queryFn: { processParametr }
        };
    }
};
//# sourceMappingURL=index.js.map