import { IEntityBase, IComplexBase, IApiContextBase, ApiContext, metadata as md } from "pailingual-odata"

//@odata.type Default.TestEnum
export enum TestEnum {
    Type1,
    Type2
}

//@odata.type Default.ComplexType
export interface ComplexType extends IComplexBase{
    field: string
}

export type Context = ApiContext<IContext>;

export interface IContext extends IApiContextBase {
    readonly Parents: Parent[];
    readonly Childs: Child[];
    readonly Singleton: Parent;
    readonly OpenTypes: OpenType[];

    $$Functions: {
        unboundFuncPrimitive(testArg: string | null): string;
        unboundFuncPrimitiveCol(): string[];
        unboundFuncComplex(): ComplexType;
        unboundFuncComplexCol(): ComplexType[];
        unboundFuncEntity(): Parent;
        unboundFuncEntityCol(): Parent[];
    };

    $$Actions: {
        unboundActionPrimitive(testArg: string, num: number): string;
        unboundActionPrimitiveCol(): string[];
        unboundActionComplex(): ComplexType;
        unboundActionComplexCol(): ComplexType[];
        unboundActionEntity(): Parent;
        unboundActionEntityCol(): Parent[];
        unboundAction(): void;
    }
}

//@odata.type Default.Parent
export interface Parent extends IEntityBase {
    id: number;
    strField: string;
    numberField?: number;
    boolField?: boolean;
    dateField?: Date;
    guid?: string;
    complexType?: ComplexType;
    enumField?: TestEnum;

    childs?: Child[];
    entityes?: TestEntity[];

    $$Actions: {
        boundAction(): void;
    };
    $$Functions: {
        entityBoundFuncPrimitive(): string,
        entityBoundFuncComplexCol(): ComplexType[]
        entityBoundFuncEntityCol(): Child[]
    };
    $$EntitySetFunctions: {
        colBoundFuncPrimitive(): number
    };
    $$EntitySetActions: {
        colBoundAction(): void
    }
}

//@odata.type Default.ParentEx
export interface ParentEx extends Parent {
    exField: string;
}

//@odata.type Default.Child
export interface Child extends IEntityBase {
    id: string;
    parentId: number;
    childField: string;
    parent?: Parent;
    firstDetail?: ChildDetails;
    details?: ChildDetails[];
}

//@odata.type Default.ChildDetails
export interface ChildDetails extends IEntityBase {
    detailsId: number
    childId: number
    enumField?: TestEnum
}

//@odata.type Default.Parent
export interface TestEntity extends IEntityBase {
    id: number;
    parentId: number;
    testEntityField: string;
}

//@odata.type Default.OpenType
export interface OpenType extends IEntityBase {
    prop1: number;
    prop2?: string;
    prop3?: ComplexType[];
    prop4?: boolean;
}

const complexT= new md.EdmEntityType ("ComplexType", { "field": new md.EdmTypeReference(md.EdmTypes.String)});

const enumT = new md.EdmEnumType("TestEnum",
    /*members*/ {
        "Type1": TestEnum.Type1,
        "Type2": TestEnum.Type2
    }
);

const parentET = new md.EdmEntityType("Parent",
    {//properties
        "id": new md.EdmTypeReference(md.EdmTypes.Int32, /*nullable*/false),
        "strField": new md.EdmTypeReference(md.EdmTypes.String, /*nullable*/false),
        "numberField": new md.EdmTypeReference(md.EdmTypes.Int32),
        "boolField": new md.EdmTypeReference(md.EdmTypes.Boolean),
        "dateField": new md.EdmTypeReference(md.EdmTypes.DateTimeOffset),
        "guid": new md.EdmTypeReference(md.EdmTypes.Guid),
        "complexType": new md.EdmTypeReference(complexT),
        "enumField": new md.EdmTypeReference(enumT)
    },
    {},    //navProperties
    ["id"] //keys
);

const childDetailsET = new md.EdmEntityType("ChildDetail",
    { //properties
        "detailsId": new md.EdmTypeReference(md.EdmTypes.Int32, false),
        "childId": new md.EdmTypeReference(md.EdmTypes.Int32, false),
        "enumField": new md.EdmTypeReference(enumT, true)
    });

const childET = new md.EdmEntityType("Child",
    { //properties
        "id": new md.EdmTypeReference(md.EdmTypes.String, false),
        "parentId": new md.EdmTypeReference(md.EdmTypes.Int32,false),
        "childField": new md.EdmTypeReference(md.EdmTypes.String, false)
    },
    { //navProperties
        "details": new md.EdmEntityTypeReference(childDetailsET, true, /*collection*/ true),
        "parent": new md.EdmEntityTypeReference(parentET, true, /*collection*/ false),
    },
    ["id"] //keys
);

const testEntityET = new md.EdmEntityType("TestEntity",
    {
        "id": new md.EdmTypeReference(md.EdmTypes.Int32, false),
        "parentId": new md.EdmTypeReference(md.EdmTypes.Int32, false),
        "testEntityField": new md.EdmTypeReference(md.EdmTypes.String, false)
    })

parentET.navProperties["childs"] = new md.EdmEntityTypeReference(childET, true, /*collection*/ true);
parentET.navProperties["entityes"] = new md.EdmEntityTypeReference(testEntityET, true, /*collection*/ true);

const parentExET = new md.EdmEntityType("ParentEx",
    { //properties:
        exField: new md.EdmTypeReference(md.EdmTypes.String, false)
    },
    {}, //navProperties
    undefined, //keys
    parentET //baseType
);

const openTypeET = new md.EdmEntityType("OpenType", {});
openTypeET.openType = true;

var namespace = new md.Namespace("Default");
namespace.addTypes(parentET, childET, childDetailsET, complexT, parentExET, openTypeET, enumT, testEntityET);
namespace.addOperations(
        //unbound Func
        new md.OperationMetadata("unboundFuncPrimitive", /*isAction*/false, /*parameters*/[{ name:"testArg", type: new md.EdmTypeReference(md.EdmTypes.String, false) }], /*returnType*/new md.EdmTypeReference(md.EdmTypes.String)),
        new md.OperationMetadata("unboundFuncPrimitiveCol",/*isAction*/false, /*parameters*/undefined, /*returnType*/new md.EdmTypeReference(md.EdmTypes.String, true, /*col*/true)),
        new md.OperationMetadata("unboundFuncComplex", /*isAction*/false, /*parameters*/undefined, /*returnType*/new md.EdmEntityTypeReference(complexT)),
        new md.OperationMetadata("unboundFuncComplexCol", /*isAction*/false, /*parameters*/undefined, /*returnType*/ new md.EdmEntityTypeReference(complexT, true, /*col*/true)),
        new md.OperationMetadata("unboundFuncEntity", /*isAction*/false, /*parameters*/undefined, /*returnType*/ new md.EdmEntityTypeReference(parentET)),
        new md.OperationMetadata("unboundFuncEntityCol", /*isAction*/false, /*parameters*/undefined, /*returnType*/ new md.EdmEntityTypeReference(parentET, true, /*col*/true)),
        //unbound actions
        new md.OperationMetadata("unboundActionPrimitive", /*isAction*/true, /*parameters*/[{ name: "testArg", type: new md.EdmTypeReference(md.EdmTypes.String, false) }, { name:"num", type: new md.EdmTypeReference(md.EdmTypes.Int32, false) }], /*returnType*/ new md.EdmTypeReference(md.EdmTypes.String)),
        new md.OperationMetadata("unboundActionPrimitiveCol", /*isAction*/true, /*parameters*/undefined, /*returnType*/ new md.EdmTypeReference(md.EdmTypes.String, true, /*col*/true)),
        new md.OperationMetadata("unboundActionComplex", /*isAction*/true, /*parameters*/undefined, /*returnType*/new md.EdmTypeReference(complexT)),
        new md.OperationMetadata("unboundActionComplexCol", /*isAction*/true, /*parameters*/undefined, /*returnType*/ new md.EdmTypeReference(complexT, true, /*col*/true)),
        new md.OperationMetadata("unboundActionEntity", /*isAction*/true, /*parameters*/undefined, /*returnType*/new md.EdmTypeReference(parentET)),
        new md.OperationMetadata("unboundActionEntityCol", /*isAction*/true, /*parameters*/undefined, /*returnType*/new md.EdmTypeReference(parentET, false, /*col*/true)),
        new md.OperationMetadata("unboundAction", /*isAction*/true, /*parameters*/undefined),
        //Entity set operations
        new md.OperationMetadata("colBoundFuncPrimitive", /*isAction*/false, /*parameters*/undefined, /*returnType*/ new md.EdmTypeReference(md.EdmTypes.Int32),/*bindingTo*/new md.EdmEntityTypeReference(parentET, true,/*col*/true)),
        new md.OperationMetadata("colBoundAction", /*isAction*/true, /*parameters*/undefined, /*returnType*/undefined, /*bindingTo*/new md.EdmEntityTypeReference(parentET, true, /*col*/true)),
        //entity operations
        new md.OperationMetadata("entityBoundFuncPrimitive", /*isAction*/false, /*parameters*/undefined, /*returnType*/new md.EdmTypeReference(md.EdmTypes.String), /*bindingTo*/ new md.EdmEntityTypeReference(parentET)),
        new md.OperationMetadata("entityBoundFuncComplexCol", /*isAction*/false, /*parameters*/undefined, /*returnType*/new md.EdmTypeReference(complexT, true, /*col*/true), /*bindingTo*/new md.EdmEntityTypeReference(parentET)),
        new md.OperationMetadata("entityBoundFuncEntityCol", /*isAction*/false, /*parameters*/undefined, /*returnType*/new md.EdmTypeReference(childET, true, /*col*/true), /*bindingTo*/new md.EdmEntityTypeReference(parentET)),
        new md.OperationMetadata("boundAction", /*isAction*/true, /*parameters*/undefined, /*returnType*/undefined, /*bindingTo*/new md.EdmEntityTypeReference(parentET)),
    );


var entitySets = {
    "Parents": parentET,
    "Childs": childET,
    "OpenTypes": openTypeET
};
var singletons = { "Singleton": parentET };
export var metadata = new md.ApiMetadata("/api","Container", {"Default": namespace}, entitySets, singletons);