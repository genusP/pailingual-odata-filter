"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
global.window = {};
const __1 = require("..");
const pailingual_odata_1 = require("pailingual-odata");
const models_1 = require("./models");
const oDataQueryFuncs_1 = require("../oDataQueryFuncs");
describe("Filter", () => {
    pailingual_odata_1.default.use(__1.default);
    const context = pailingual_odata_1.default.createApiContext(models_1.metadata);
    it("1", () => {
        const actual = context.Parents.$filter(e => e.id == 1).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=id eq 1");
    });
    it("guid", () => {
        const actual = context.Parents.$filter(e => e.guid == "f1247c47-ecaf-4649-9a8b-c3ea5817b894").$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=guid eq f1247c47-ecaf-4649-9a8b-c3ea5817b894");
    });
    it("null", () => {
        const actual = context.Parents.$filter(e => e.numberField == null).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=numberField eq null");
    });
    it("true", () => {
        const actual = context.Parents.$filter(e => e.boolField == true).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=boolField eq true");
    });
    it("false", () => {
        const actual = context.Parents.$filter(e => e.boolField == false).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=boolField eq false");
    });
    it("int as boolean", () => {
        const actual1 = context.Parents.$filter(e => e.boolField == 1).$url();
        const actual2 = context.Parents.$filter(e => e.boolField == 0).$url();
        chai_1.assert.equal(actual1, "/api/Parents?$filter=boolField eq true");
        chai_1.assert.equal(actual2, "/api/Parents?$filter=boolField eq false");
    });
    it("Or", () => {
        const actual = context.Parents.$filter(e => e.id == 1 || e.id === 2).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=id eq 1 or id eq 2");
    });
    it("And", () => {
        const actual = context.Parents.$filter(e => e.id !== 1 && e.id !== 2).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=id ne 1 and id ne 2");
    });
    it("Addition", () => {
        const actual = context.Parents.$filter(e => e.id + 1 == 2).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=id add 1 eq 2");
    });
    it("Substraction", () => {
        const actual = context.Parents.$filter(e => e.id - 1 == 0).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=id sub 1 eq 0");
    });
    it("Multiplication ", () => {
        const actual = context.Parents.$filter(e => e.id * 1 == 1).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=id mul 1 eq 1");
    });
    it("Division ", () => {
        const actual = context.Parents.$filter(e => e.id / 1 == 1).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=id divby 1 eq 1");
    });
    it("Grouping", () => {
        const actual = context.Parents.$filter(e => (e.id + 1) * 2 == 2).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=(id add 1) mul 2 eq 2");
    });
    it("Grouping 2", () => {
        const actual = context.Parents.$filter(e => 2 * (e.id + 1) == 2).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=2 mul (id add 1) eq 2");
    });
    it("Grouping 3", () => {
        //Comments in group expression not support
        //const actual = context.Parents.$filter(null, e => 2 * (/*comment for test valid grouping*/e.id + 1 -1/*comment*/) == 2).result()
        const actual = context.Parents.$filter(e => 2 * (e.id + 1 - 1) == 2).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=2 mul (id add 1 sub 1) eq 2");
    });
    it("Parameters", () => {
        let id = 1;
        const actual = context.Parents.$filter((e, p) => e.id == p.id, { id }).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=id eq 1");
    });
    it("Parameters bool", () => {
        let v = false;
        const actual = context.Parents.$filter((e, p) => e.boolField == p.v, { v }).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=boolField eq false");
    });
    it("Func concat", () => {
        const actual = context.Parents.$filter((e, p, f) => f.concat(e.strField, 'v') == 'test').$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=concat(strField,'v') eq 'test'");
    });
    it("Enum", () => {
        const actual = context.Parents.$filter((e, p) => e.enumField == p.ef, { ef: models_1.TestEnum.Type2 }).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=enumField eq Default.TestEnum'Type2'");
    });
    it("Enum prefix free", () => {
        const actual = context.Parents
            .$filter((e, p) => e.enumField == p.ef, { ef: models_1.TestEnum.Type2 })
            .$url({ enumPrefixFree: true });
        chai_1.assert.equal(actual, "/api/Parents?$filter=enumField eq 'Type2'");
    });
    it("Enum expand with filter", () => {
        const query = context.Childs
            .$byKey(1)
            .$expand("details", d => d.$filter((i, p) => i.enumField == p.ef, { ef: models_1.TestEnum.Type1 }));
        const url = query.$url();
        const url2 = query.$url({ enumPrefixFree: true });
        chai_1.assert.equal(url, "/api/Childs('1')?$expand=details($filter=enumField eq Default.TestEnum'Type1')");
        chai_1.assert.equal(url2, "/api/Childs('1')?$expand=details($filter=enumField eq 'Type1')");
    });
    it("Any", () => {
        const actual = context.Parents.$filter(e => e.childs.any(d => d.childField == "1")).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=childs/any(d:d/childField eq '1')");
    });
    it("All", () => {
        const actual = context.Parents.$filter((e, p, f) => e.childs.any(d => f.contains(d.childField, p.v)), { v: "a" }).$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=childs/any(d:contains(d/childField,'a'))");
    });
    it("Single-value navigation property", () => {
        const actual = context.Childs.$filter(e => e.parent.id > 1).$url();
        chai_1.assert.equal(actual, "/api/Childs?$filter=parent/id gt 1");
    });
    it("Multi-line expression", () => {
        const actual = context.Parents
            .$filter(e => e.id == 1)
            .$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=id eq 1");
    });
    it("bound Function", () => {
        const actual = context.Parents.$byKey(1)
            .entityBoundFuncEntityCol()
            .$filter(e => e.childField == "test")
            .$url();
        chai_1.assert.equal(actual, "/api/Parents(1)/Default.entityBoundFuncEntityCol()?$filter=childField eq 'test'");
    });
    it("Multi-line expression with lambda", () => {
        const actual = context.Parents
            .$filter(e => e.childs.any(d => d.childField ==
            "1"))
            .$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=childs/any(d:d/childField eq '1')");
    });
    it("in operator", () => {
        const actual = context.Parents
            .$filter(e => e.strField in ["a", "b", "c"])
            .$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=strField in ('a','b','c')");
    });
    it("in operator 2", () => {
        const actual = context.Parents
            .$filter(e => e.numberField in [1, 2, 3])
            .$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=numberField in (1,2,3)");
    });
    it("in operator with param", () => {
        const list = ["a", "b", "c"];
        const actual = context.Parents
            .$filter((e, p) => e.strField in p.list, { list })
            .$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=strField in ('a','b','c')");
    });
    it("in operator with param 2", () => {
        const element = "c";
        const actual = context.Parents
            .$filter((e, p) => e.strField in ["a", "b", p.element], { element })
            .$url();
        chai_1.assert.equal(actual, "/api/Parents?$filter=strField in ('a','b','c')");
    });
    it("Exist metadata query options filter", () => {
        let funcs = new QueryFunctions();
        for (let fn in funcs) {
            let func = funcs[fn];
            var argsCnt = func.length;
            const metadata = oDataQueryFuncs_1.ODataFunctionsMetadata[fn];
            chai_1.assert.ok(metadata, `Metadata for query function '${fn}' not registred`);
            chai_1.assert.ok(metadata.filter(m => m.arguments.length == argsCnt).length != 0, `Argument count not equals for '${fn}'`);
        }
    });
});
class QueryFunctions {
    concat(left, right) {
        throw new Error("Method not implemented.");
    }
    contains(left, right) {
        throw new Error("Method not implemented.");
    }
    endswith(text, search) {
        throw new Error("Method not implemented.");
    }
    indexof(text, search) {
        throw new Error("Method not implemented.");
    }
    length(text) {
        throw new Error("Method not implemented.");
    }
    startswith(text, search) {
        throw new Error("Method not implemented.");
    }
    substring(text, start, length) {
        throw new Error("Method not implemented.");
    }
    tolower(text) {
        throw new Error("Method not implemented.");
    }
    toupper(text) {
        throw new Error("Method not implemented.");
    }
    trim(text) {
        throw new Error("Method not implemented.");
    }
    date(datetime) {
        throw new Error("Method not implemented.");
    }
    day(date) {
        throw new Error("Method not implemented.");
    }
    fractionalseconds(date) {
        throw new Error("Method not implemented.");
    }
    hour(date) {
        throw new Error("Method not implemented.");
    }
    maxdatetime() {
        throw new Error("Method not implemented.");
    }
    mindatetime() {
        throw new Error("Method not implemented.");
    }
    minute(date) {
        throw new Error("Method not implemented.");
    }
    month(date) {
        throw new Error("Method not implemented.");
    }
    now() {
        throw new Error("Method not implemented.");
    }
    second(date) {
        throw new Error("Method not implemented.");
    }
    time(date) {
        throw new Error("Method not implemented.");
    }
    totaloffsetminutes(date) {
        throw new Error("Method not implemented.");
    }
    year(date) {
        throw new Error("Method not implemented.");
    }
    celling(value) {
        throw new Error("Method not implemented.");
    }
    floor(value) {
        throw new Error("Method not implemented.");
    }
    round(value) {
        throw new Error("Method not implemented.");
    }
}
//# sourceMappingURL=filterExpressionTests.js.map