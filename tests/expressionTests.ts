﻿import { assert } from "chai";
(global as any).window = {};
import filterPlugin from ".."
import Pailingual from "pailingual-odata";
import { IContext, metadata, TestEnum} from "./models";
import { ODataFunctions, ODataFunctionsMetadata } from "../oDataQueryFuncs";
import cases from "./cases";

describe("Filter", () => {

    Pailingual.use(filterPlugin)
    const context = Pailingual.createApiContext<IContext>(metadata);
    for (let testCase of cases) {
        it(testCase.name, () => {
            const actual = testCase.expression(context);
            assert.equal(actual, testCase.expectedUrl);
        })
    }

    it("Parameters bool", () => {
        let v = false;
        const actual = context.Parents.$filter((e, p) => e.boolField == p.v, { v }).$url();
        assert.equal(actual, "/api/Parents?$filter=boolField eq false");
    });

    it("Func concat", () => {
        const actual = context.Parents.$filter((e, p, f) => f.concat(e.strField, 'v') == 'test').$url();
        assert.equal(actual, "/api/Parents?$filter=concat(strField,'v') eq 'test'");
    });

    it("Enum", () => {
        const actual = context.Parents.$filter((e, p) => e.enumField == p.ef, { ef: TestEnum.Type2 }).$url();
        assert.equal(actual, "/api/Parents?$filter=enumField eq Default.TestEnum'Type2'");
    });

    it("Enum prefix free", () => {
        const actual = context.Parents
            .$filter((e, p) => e.enumField == p.ef, { ef: TestEnum.Type2 })
            .$url({ enumPrefixFree: true });
        assert.equal(actual, "/api/Parents?$filter=enumField eq 'Type2'");
    });

    it("Enum expand with filter", () => {
        const query = context.Childs
            .$byKey(1)
            .$expand("details", d => d.$filter((i, p) => i.enumField == p.ef, { ef: TestEnum.Type1 }));
        const url = query.$url();
        const url2 = query.$url({ enumPrefixFree: true });
        assert.equal(url, "/api/Childs('1')?$expand=details($filter=enumField eq Default.TestEnum'Type1')");
        assert.equal(url2, "/api/Childs('1')?$expand=details($filter=enumField eq 'Type1')");
    });

    it("Any", () => {
        const actual = context.Parents.$filter(e => e.childs.any(d => d.childField == "1")).$url();
        assert.equal(actual, "/api/Parents?$filter=childs/any(d:d/childField eq '1')");
    });

    it("All", () => {
        const actual = context.Parents.$filter((e, p, f) => e.childs.any(d => f.contains(d.childField, p.v)), {v:"a"}).$url();
        assert.equal(actual, "/api/Parents?$filter=childs/any(d:contains(d/childField,'a'))");
    });

    it("Single-value navigation property", () => {
        const actual = context.Childs.$filter(e => e.parent.id > 1).$url();
        assert.equal(actual, "/api/Childs?$filter=parent/id gt 1");
    })

    it("Multi-line expression", () => {
        const actual = context.Parents
            .$filter(e =>
                e.id == 1)
            .$url();
        assert.equal(actual, "/api/Parents?$filter=id eq 1");
    });

    it("bound Function", () => {
        const actual = context.Parents.$byKey(1)
            .entityBoundFuncEntityCol()
            .$filter(e => e.childField == "test")
            .$url();

        assert.equal(actual, "/api/Parents(1)/Default.entityBoundFuncEntityCol()?$filter=childField eq 'test'");
    });

    it("Multi-line expression with lambda", () => {
        const actual = context.Parents
            .$filter(e =>
                e.childs.any(d => d.childField ==
                    "1"))
            .$url();
        assert.equal(actual, "/api/Parents?$filter=childs/any(d:d/childField eq '1')");
    });

    it("in operator", () => {
        const actual = context.Parents
            .$filter(e => e.strField in ["a", "b", "c"])
            .$url();

        assert.equal(actual, "/api/Parents?$filter=strField in ('a','b','c')");
    });

    it("in operator 2", () => {
        const actual = context.Parents
            .$filter(e => e.numberField in [1, 2, 3])
            .$url();

        assert.equal(actual, "/api/Parents?$filter=numberField in (1,2,3)");
    });

    it("in operator with param", () => {
        const list = ["a", "b", "c"];
        const actual = context.Parents
            .$filter((e, p) => e.strField in p.list, { list })
            .$url();

        assert.equal(actual, "/api/Parents?$filter=strField in ('a','b','c')");
    });

    it("in operator with param 2", () => {
        const element = "c";
        const actual = context.Parents
            .$filter((e, p) => e.strField in ["a","b",p.element], { element })
            .$url();

        assert.equal(actual, "/api/Parents?$filter=strField in ('a','b','c')");
    })

    it("Exist metadata query options filter", () => {
        let funcs = new QueryFunctions() as any as Record<string, Function>;
        for (let fn in funcs) {
            let func = funcs[fn];
            var argsCnt = func.length;

            const metadata = ODataFunctionsMetadata[fn];
            assert.ok(metadata, `Metadata for query function '${fn}' not registred`);
            assert.ok(metadata.filter(m => m.arguments.length == argsCnt).length != 0, `Argument count not equals for '${fn}'`)
        }
    });
});

class QueryFunctions implements ODataFunctions {
    concat<T extends string | any[]>(left: T, right: T): T {
        throw new Error("Method not implemented.");
    }
    contains(left: string, right: string): boolean {
        throw new Error("Method not implemented.");
    }
    endswith(text: string, search: string): boolean {
        throw new Error("Method not implemented.");
    }
    indexof(text: string, search: string): number {
        throw new Error("Method not implemented.");
    }
    length(text: string): number {
        throw new Error("Method not implemented.");
    }
    startswith(text: string, search: string): boolean {
        throw new Error("Method not implemented.");
    }
    substring(text: string, start: number, length?: number | undefined): string {
        throw new Error("Method not implemented.");
    }
    tolower(text: string): string {
        throw new Error("Method not implemented.");
    }
    toupper(text: string): string {
        throw new Error("Method not implemented.");
    }
    trim(text: string): string {
        throw new Error("Method not implemented.");
    }
    date(datetime: Date): Date {
        throw new Error("Method not implemented.");
    }
    day(date: Date): number {
        throw new Error("Method not implemented.");
    }
    fractionalseconds(date: Date): number {
        throw new Error("Method not implemented.");
    }
    hour(date: Date): number {
        throw new Error("Method not implemented.");
    }
    maxdatetime(): Date {
        throw new Error("Method not implemented.");
    }
    mindatetime(): Date {
        throw new Error("Method not implemented.");
    }
    minute(date: Date): number {
        throw new Error("Method not implemented.");
    }
    month(date: Date): number {
        throw new Error("Method not implemented.");
    }
    now(): Date {
        throw new Error("Method not implemented.");
    }
    second(date: Date): number {
        throw new Error("Method not implemented.");
    }
    time(date: Date): Date {
        throw new Error("Method not implemented.");
    }
    totaloffsetminutes(date: Date): number {
        throw new Error("Method not implemented.");
    }
    year(date: Date): number {
        throw new Error("Method not implemented.");
    }
    celling(value: number): number {
        throw new Error("Method not implemented.");
    }
    floor(value: number): number {
        throw new Error("Method not implemented.");
    }
    round(value: number): number {
        throw new Error("Method not implemented.");
    }
}
