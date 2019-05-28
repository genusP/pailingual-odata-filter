import { Context, Parent, TestEnum } from "./models";
import { EntitySet, FilterExpression } from "pailingual-odata";

export type TestCase = {
    name: string,
    expression: (ctx: Context) => string,
    expectedUrl?: string,
    expectedTransform: string
}
function customFilterFunc<T, TParam>(expr: FilterExpression<T, TParam>, param?: TParam) { }
export default [
    {
        name: "metadata from comment",
        expression: ctx => (parents: EntitySet<Parent>) => parents.$filter(e => e.id == 1),
        expectedTransform: "(parents: EntitySet<Parent>) => parents.$filter(\"id eq 1\")"
    },
    {
        name: "metadata from context",
        expression: ctx => ctx.TestEntities.$filter(e => e.id == 1),
        expectedTransform: "ctx.TestEntities.$filter(\"id eq 1\")"
    },
    {
        name: "non in $filter func",
        expression: ctx => customFilterFunc<Parent, void>(e => e.id == 1),
        expectedTransform: "customFilterFunc<Parent, void>(\"id eq 1\")"
    },
    {
        name: "non in $filter func with params",
        expression: ctx => {
            let p = 1;
            customFilterFunc<Parent, { p: number }>((e, p) => e.id == p.p, { p })
        },
        expectedTransform: "{\r\n    let p = 1;\r\n    customFilterFunc<Parent, {\r\n        p: number;\r\n    }>(\"id eq \"+serialization.serializeValue(p, \"Edm.Int32\", true)+\"\", { p });\r\n}"
    },
    {
        name: "1",
        expression: ctx => ctx.Parents.$filter(e => e.id == 1).$url(),
        expectedUrl: "/api/Parents?$filter=id eq 1",
        expectedTransform: "ctx.Parents.$filter(\"id eq 1\").$url()"
    },
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
        expression: ctx => { let id = 1; return ctx.Parents.$filter((e, p) => e.id == p.id, { id }).$url();},
        expectedUrl: "/api/Parents?$filter=id eq 1",
        expectedTransform: "{\r\n    let id = 1;\r\n    return ctx.Parents.$filter(\"id eq \"+serialization.serializeValue(id, \"Edm.Int32\", true)+\"\").$url();\r\n}"
    },
    {
        name: "Parameters bool",
        expression: ctx => {
        let v = false;
        return ctx.Parents.$filter((e, p) => e.boolField == p.v, { v }).$url();
        },
        expectedUrl: "/api/Parents?$filter=boolField eq false",
        expectedTransform: "{\r\n    let v = false;\r\n    return ctx.Parents.$filter(\"boolField eq \"+serialization.serializeValue(v, \"Edm.Boolean\", true)+\"\").$url();\r\n}"
    },
    {
        name: "Func concat",
        expression: ctx => ctx.Parents.$filter((e, p, f) => f.concat(e.strField, 'v') == 'test').$url(),
        expectedUrl: "/api/Parents?$filter=concat(strField,'v') eq 'test'",
        expectedTransform: "ctx.Parents.$filter(\"concat(strField,'v') eq 'test'\").$url()"
    },
    {
        name: "Enum",
        expression: ctx => ctx.Parents.$filter((e, p) => e.enumField == p.ef, { ef: TestEnum.Type2 }).$url(),
        expectedUrl: "/api/Parents?$filter=enumField eq Default.TestEnum'Type2'",
        expectedTransform: "ctx.Parents.$filter(\"enumField eq \"+serialization.serializeValue(TestEnum.Type2, ctx.__apiMetadata.getEdmTypeMetadata(\"Default.TestEnum\"), true)+\"\").$url()"
    },
    {
        name: "Enum expand with filter",
        expression: ctx => ctx.Childs.$byKey(1).$expand("details", d => d.$filter((i, p) => i.enumField == p.ef, { ef: TestEnum.Type1 })).$url(),
        expectedUrl: "/api/Childs('1')?$expand=details($filter=enumField eq Default.TestEnum'Type1')",
        expectedTransform: "ctx.Childs.$byKey(1).$expand(\"details\", d => d.$filter(\"enumField eq \"+serialization.serializeValue(TestEnum.Type1, d.__apiMetadata.getEdmTypeMetadata(\"Default.TestEnum\"), true)+\"\")).$url()"
    },
    {
        name: "Any",
        expression: ctx => ctx.Parents.$filter(e => e.childs.any(d => d.childField == "1")).$url(),
        expectedUrl: "/api/Parents?$filter=childs/any(d:d/childField eq '1')",
        expectedTransform: "ctx.Parents.$filter(\"childs/any(d:d/childField eq '1')\").$url()"
    },
    {
        name: "All",
        expression: ctx => ctx.Parents.$filter((e, p, f) => e.childs.any(d => f.contains(d.childField, p.v)), { v: "a" }).$url(),
        expectedUrl: "/api/Parents?$filter=childs/any(d:contains(d/childField,'a'))",
        expectedTransform: "ctx.Parents.$filter(\"childs/any(d:contains(d/childField,\"+serialization.serializeValue(\"a\", \"Edm.String\", true)+\"))\").$url()"
    },
    {
        name: "Single-value navigation property",
        expression: ctx => ctx.Childs.$filter(e => e.parent.id > 1).$url(),
        expectedUrl: "/api/Childs?$filter=parent/id gt 1",
        expectedTransform:"ctx.Childs.$filter(\"parent/id gt 1\").$url()"
    },
    {
        name: "Multi-line expression",
        expression: ctx => ctx.Parents.$filter(e => e.id == 1).$url(),
        expectedUrl: "/api/Parents?$filter=id eq 1",
        expectedTransform: "ctx.Parents.$filter(\"id eq 1\").$url()"
    },
    {
        name: "bound Function",
        expression: ctx => ctx.Parents.$byKey(1).entityBoundFuncEntityCol().$filter(e => e.childField == "test").$url(),
        expectedUrl: "/api/Parents(1)/Default.entityBoundFuncEntityCol()?$filter=childField eq 'test'",
        expectedTransform: "ctx.Parents.$byKey(1).entityBoundFuncEntityCol().$filter(\"childField eq 'test'\").$url()"
    },
    {
        name: "Multi-line expression with lambda",
        expression: ctx => ctx.Parents
            .$filter(e =>
                e.childs.any(d => d.childField ==
                    "1"))
            .$url(),
        expectedUrl: "/api/Parents?$filter=childs/any(d:d/childField eq '1')",
        expectedTransform: "ctx.Parents\r\n    .$filter(\"childs/any(d:d/childField eq '1')\")\r\n    .$url()"
    },
    {
        name: "in operator",
        expression: ctx => ctx.Parents.$filter(e => e.strField in ["a", "b", "c"]).$url(),
        expectedUrl: "/api/Parents?$filter=strField in ('a','b','c')",
        expectedTransform: "ctx.Parents.$filter(\"strField in ('a','b','c')\").$url()"
    },
    {
        name: "in operator 2",
        expression: ctx => ctx.Parents.$filter(e => e.numberField in [1, 2, 3]).$url(),
        expectedUrl: "/api/Parents?$filter=numberField in (1,2,3)",
        expectedTransform: "ctx.Parents.$filter(\"numberField in (1,2,3)\").$url()"
    },
    {
        name: "in operator with param",
        expression: ctx => {
            const list = ["a", "b", "c"];
            return ctx.Parents.$filter((e, p) => e.strField in p.list, { list }).$url()
        },
        expectedUrl: "/api/Parents?$filter=strField in ('a','b','c')",
        expectedTransform: "{\r\n    const list = [\"a\", \"b\", \"c\"];\r\n    return ctx.Parents.$filter(\"strField in (\"+list.map(e=>serialization.serializeValue(e, \"Edm.String\", true))+\")\").$url();\r\n}"
    },
    {
        name: "in operator with param 2",
        expression: ctx => {
            const element = "c";
            return ctx.Parents.$filter((e, p) => e.strField in ["a", "b", p.element], { element }).$url();
        },
        expectedUrl: "/api/Parents?$filter=strField in ('a','b','c')",
        expectedTransform: "{\r\n    const element = \"c\";\r\n    return ctx.Parents.$filter(\"strField in ('a','b',\"+serialization.serializeValue(element, \"Edm.String\", true)+\")\").$url();\r\n}"
    }    
] as TestCase[]