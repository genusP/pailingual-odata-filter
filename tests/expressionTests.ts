import { assert } from "chai";
(global as any).window = {};
import filterPlugin from ".."
import { Pailingual, csdl } from "pailingual-odata";
import { IContext, createMetadata, TestEnum } from "./models";
import { ODataFunctions, ODataFunctionsMetadata } from "../oDataQueryFuncs";
import cases from "./cases";

describe("Filter", () => {

    //TESTS FROM cases.ts
    Pailingual.use(filterPlugin)
    const context = Pailingual.createApiContext<IContext>(createMetadata() as csdl.MetadataDocument);
    const context401 = Pailingual.createApiContext<IContext>(createMetadata("4.01") as csdl.MetadataDocument);
    for (let testCase of cases) {
        if (Object.getOwnPropertyNames(testCase).indexOf("expectedUrl") >-1) {

            it(testCase.name, () => {
                const actual = testCase.expression(testCase.version == "4.01" ? context401 : context);
                assert.equal(actual, testCase.expectedUrl);
            });


        }
    }

    it("Enum prefix free", () => {
        const actual = context.Parents
            .$filter((e, p) => e.enumField == p.ef, { ef: TestEnum.Type2 })
            .$url({ enumPrefixFree: true });
        assert.equal(actual, "/api/Parents?$filter=enumField eq 'Type2'");
    });

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
