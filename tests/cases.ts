import { Context, Parent } from "./models";
import { EntitySet } from "pailingual-odata";

export type TestCase = {
    name: string,
    expression: (ctx: Context) => string,
    expectedUrl?: string,
    expectedTransform: string
}
export default [
    { name: "metadata", expression: ctx => (parents: EntitySet<Parent>) => parents.$filter(e => e.id == 1), expectedTransform: "(parents: EntitySet<Parent>) => parents.$filter(\"id eq 1\")" },
    { name: "1", expression: ctx => ctx.Parents.$filter(e => e.id == 1).$url(), expectedUrl: "/api/Parents?$filter=id eq 1", expectedTransform: "ctx.Parents.$filter(\"id eq 1\").$url()" },
    {
        name: "guid",
        expression: ctx => ctx.Parents.$filter(e => e.guid == "f1247c47-ecaf-4649-9a8b-c3ea5817b894").$url(),
        expectedUrl: "/api/Parents?$filter=guid eq f1247c47-ecaf-4649-9a8b-c3ea5817b894",
        expectedTransform: "ctx.Parents.$filter(\"guid eq f1247c47-ecaf-4649-9a8b-c3ea5817b894\").$url()"
    },
    {
        name: "null",
        expression: ctx => ctx.Parents.$filter(e => e.numberField == null).$url(),
        expectedUrl: "/api/Parents?$filter=numberField eq null",
        expectedTransform: "ctx.Parents.$filter(\"numberField eq null\").$url()"
    },
    {
        name: "true",
        expression: ctx => ctx.Parents.$filter(e => e.boolField == true).$url(),
        expectedUrl: "/api/Parents?$filter=boolField eq true",
        expectedTransform: "ctx.Parents.$filter(\"boolField eq true\").$url()"
    },
    {
        name: "false",
        expression: ctx => ctx.Parents.$filter(e => e.boolField == false).$url(),
        expectedUrl: "/api/Parents?$filter=boolField eq false",
        expectedTransform: "ctx.Parents.$filter(\"boolField eq false\").$url()"
    },
    {
        name: "int as boolean true",
        expression: ctx => ctx.Parents.$filter(e => e.boolField == 1 as any).$url(),
        expectedUrl: "/api/Parents?$filter=boolField eq true",
        expectedTransform: "ctx.Parents.$filter(\"boolField eq true\").$url()"
    },
    {
        name: "int as boolean false",
        expression: ctx => ctx.Parents.$filter(e => e.boolField == 0 as any).$url(),
        expectedUrl: "/api/Parents?$filter=boolField eq false",
        expectedTransform: "ctx.Parents.$filter(\"boolField eq false\").$url()"
    },
    {
        name: "Or",
        expression: ctx => ctx.Parents.$filter(e => e.id == 1 || e.id === 2).$url(),
        expectedUrl: "/api/Parents?$filter=id eq 1 or id eq 2",
        expectedTransform: "ctx.Parents.$filter(\"id eq 1 or id eq 2\").$url()"
    },
    {
        name: "And",
        expression: ctx => ctx.Parents.$filter(e => e.id !== 1 && e.id !== 2).$url(),
        expectedUrl: "/api/Parents?$filter=id ne 1 and id ne 2",
        expectedTransform:"ctx.Parents.$filter(\"id ne 1 and id ne 2\").$url()"
    },
    {
        name: "Addition",
        expression: ctx => ctx.Parents.$filter(e => e.id + 1 == 2).$url(),
        expectedUrl: "/api/Parents?$filter=id add 1 eq 2",
        expectedTransform:"ctx.Parents.$filter(\"id add 1 eq 2\").$url()"
    },
    {
        name: "Substraction",
        expression: ctx => ctx.Parents.$filter(e => e.id - 1 == 0).$url(),
        expectedUrl: "/api/Parents?$filter=id sub 1 eq 0",
        expectedTransform:"ctx.Parents.$filter(\"id sub 1 eq 0\").$url()"
    },
    {
        name: "Multiplication ",
        expression: ctx => ctx.Parents.$filter(e => e.id * 1 == 1).$url(),
        expectedUrl: "/api/Parents?$filter=id mul 1 eq 1",
        expectedTransform: "ctx.Parents.$filter(\"id mul 1 eq 1\").$url()"
    },
    {
        name: "Division ",
        expression: ctx => ctx.Parents.$filter(e => e.id / 1 == 1).$url(),
        expectedUrl: "/api/Parents?$filter=id divby 1 eq 1",
        expectedTransform: "ctx.Parents.$filter(\"id divby 1 eq 1\").$url()"
    },
    {
        name: "Grouping",
        expression: ctx => ctx.Parents.$filter(e => (e.id + 1) * 2 == 2).$url(),
        expectedUrl: "/api/Parents?$filter=(id add 1) mul 2 eq 2",
        expectedTransform: "ctx.Parents.$filter(\"(id add 1) mul 2 eq 2\").$url()"
    },
    {
        name: "Grouping 2",
        expression: ctx => ctx.Parents.$filter(e => 2 * (e.id + 1) == 2).$url(),
        expectedUrl: "/api/Parents?$filter=2 mul (id add 1) eq 2",
        expectedTransform: "ctx.Parents.$filter(\"2 mul (id add 1) eq 2\").$url()"
    },
    {
        name: "Parameters",
        expression: ctx => {
            let id = 1;
            return ctx.Parents.$filter((e, p) => e.id == p.id, { id }).$url()
        },
        expectedUrl: "/api/Parents?$filter=id eq 1",
        expectedTransform: "ctx.Parents.$filter(\"id eq \"+import(\"pailingual-odata\").serialize.serializeValue(id,\"Edm.Int32\", true)).$url()"
    }
] as TestCase[]