"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metadata_1 = require("pailingual-odata/src/metadata");
var TestEnum;
(function (TestEnum) {
    TestEnum[TestEnum["Type1"] = 0] = "Type1";
    TestEnum[TestEnum["Type2"] = 1] = "Type2";
})(TestEnum = exports.TestEnum || (exports.TestEnum = {}));
const complexT = new metadata_1.EdmEntityType("ComplexType", { "field": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String) });
const enumT = new metadata_1.EdmEnumType("TestEnum", 
/*members*/ {
    "Type1": TestEnum.Type1,
    "Type2": TestEnum.Type2
});
const parentET = new metadata_1.EdmEntityType("Parent", {
    "id": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Int32, /*nullable*/ false),
    "strField": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String, /*nullable*/ false),
    "numberField": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Int32),
    "boolField": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Boolean),
    "dateField": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.DateTimeOffset),
    "guid": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Guid),
    "complexType": new metadata_1.EdmTypeReference(complexT),
    "enumField": new metadata_1.EdmTypeReference(enumT)
}, {}, //navProperties
["id"] //keys
);
const childDetailsET = new metadata_1.EdmEntityType("ChildDetail", {
    "detailsId": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Int32, false),
    "childId": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Int32, false),
    "enumField": new metadata_1.EdmTypeReference(enumT, true)
});
const childET = new metadata_1.EdmEntityType("Child", {
    "id": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String, false),
    "parentId": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Int32, false),
    "childField": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String, false)
}, {
    "details": new metadata_1.EdmEntityTypeReference(childDetailsET, true, /*collection*/ true),
    "parent": new metadata_1.EdmEntityTypeReference(parentET, true, /*collection*/ false),
}, ["id"] //keys
);
const testEntityET = new metadata_1.EdmEntityType("TestEntity", {
    "id": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Int32, false),
    "parentId": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Int32, false),
    "testEntityField": new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String, false)
});
parentET.navProperties["childs"] = new metadata_1.EdmEntityTypeReference(childET, true, /*collection*/ true);
parentET.navProperties["entityes"] = new metadata_1.EdmEntityTypeReference(testEntityET, true, /*collection*/ true);
const parentExET = new metadata_1.EdmEntityType("ParentEx", {
    exField: new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String, false)
}, {}, //navProperties
undefined, //keys
parentET //baseType
);
const openTypeET = new metadata_1.EdmEntityType("OpenType", {});
openTypeET.openType = true;
var namespace = new metadata_1.Namespace("Default");
namespace.addTypes(parentET, childET, childDetailsET, complexT, parentExET, openTypeET, enumT);
namespace.addOperations(
//unbound Func
new metadata_1.OperationMetadata("unboundFuncPrimitive", /*isAction*/ false, /*parameters*/ [{ name: "testArg", type: new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String, false) }], /*returnType*/ new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String)), new metadata_1.OperationMetadata("unboundFuncPrimitiveCol", /*isAction*/ false, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String, true, /*col*/ true)), new metadata_1.OperationMetadata("unboundFuncComplex", /*isAction*/ false, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmEntityTypeReference(complexT)), new metadata_1.OperationMetadata("unboundFuncComplexCol", /*isAction*/ false, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmEntityTypeReference(complexT, true, /*col*/ true)), new metadata_1.OperationMetadata("unboundFuncEntity", /*isAction*/ false, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmEntityTypeReference(parentET)), new metadata_1.OperationMetadata("unboundFuncEntityCol", /*isAction*/ false, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmEntityTypeReference(parentET, true, /*col*/ true)), 
//unbound actions
new metadata_1.OperationMetadata("unboundActionPrimitive", /*isAction*/ true, /*parameters*/ [{ name: "testArg", type: new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String, false) }, { name: "num", type: new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Int32, false) }], /*returnType*/ new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String)), new metadata_1.OperationMetadata("unboundActionPrimitiveCol", /*isAction*/ true, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String, true, /*col*/ true)), new metadata_1.OperationMetadata("unboundActionComplex", /*isAction*/ true, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmTypeReference(complexT)), new metadata_1.OperationMetadata("unboundActionComplexCol", /*isAction*/ true, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmTypeReference(complexT, true, /*col*/ true)), new metadata_1.OperationMetadata("unboundActionEntity", /*isAction*/ true, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmTypeReference(parentET)), new metadata_1.OperationMetadata("unboundActionEntityCol", /*isAction*/ true, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmTypeReference(parentET, false, /*col*/ true)), new metadata_1.OperationMetadata("unboundAction", /*isAction*/ true, /*parameters*/ undefined), 
//Entity set operations
new metadata_1.OperationMetadata("colBoundFuncPrimitive", /*isAction*/ false, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmTypeReference(metadata_1.EdmTypes.Int32), /*bindingTo*/ new metadata_1.EdmEntityTypeReference(parentET, true, /*col*/ true)), new metadata_1.OperationMetadata("colBoundAction", /*isAction*/ true, /*parameters*/ undefined, /*returnType*/ undefined, /*bindingTo*/ new metadata_1.EdmEntityTypeReference(parentET, true, /*col*/ true)), 
//entity operations
new metadata_1.OperationMetadata("entityBoundFuncPrimitive", /*isAction*/ false, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmTypeReference(metadata_1.EdmTypes.String), /*bindingTo*/ new metadata_1.EdmEntityTypeReference(parentET)), new metadata_1.OperationMetadata("entityBoundFuncComplexCol", /*isAction*/ false, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmTypeReference(complexT, true, /*col*/ true), /*bindingTo*/ new metadata_1.EdmEntityTypeReference(parentET)), new metadata_1.OperationMetadata("entityBoundFuncEntityCol", /*isAction*/ false, /*parameters*/ undefined, /*returnType*/ new metadata_1.EdmTypeReference(childET, true, /*col*/ true), /*bindingTo*/ new metadata_1.EdmEntityTypeReference(parentET)), new metadata_1.OperationMetadata("boundAction", /*isAction*/ true, /*parameters*/ undefined, /*returnType*/ undefined, /*bindingTo*/ new metadata_1.EdmEntityTypeReference(parentET)));
var entitySets = {
    "Parents": parentET,
    "Childs": childET,
    "OpenTypes": openTypeET
};
var singletons = { "Singleton": parentET };
exports.metadata = new metadata_1.ApiMetadata("/api", "Container", { "Default": namespace }, entitySets, singletons);
//# sourceMappingURL=models.js.map