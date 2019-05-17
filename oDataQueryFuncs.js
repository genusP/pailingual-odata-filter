"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metadata_1 = require("pailingual-odata/src/metadata");
exports.ODataFunctionsMetadata = {
    "concat": [{ return: metadata_1.EdmTypes.String, arguments: [metadata_1.EdmTypes.String, metadata_1.EdmTypes.String] }],
    "contains": [{ return: metadata_1.EdmTypes.Boolean, arguments: [metadata_1.EdmTypes.String, metadata_1.EdmTypes.String] }],
    "endswith": [{ return: metadata_1.EdmTypes.Boolean, arguments: [metadata_1.EdmTypes.String, metadata_1.EdmTypes.String] }],
    "indexof": [{ return: metadata_1.EdmTypes.Boolean, arguments: [metadata_1.EdmTypes.String, metadata_1.EdmTypes.String] }],
    "length": [{ return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.String] }],
    "startswith": [{ return: metadata_1.EdmTypes.Boolean, arguments: [metadata_1.EdmTypes.String, metadata_1.EdmTypes.String] }],
    "substring": [{ return: metadata_1.EdmTypes.String, arguments: [metadata_1.EdmTypes.String, metadata_1.EdmTypes.Int32] },
        { return: metadata_1.EdmTypes.String, arguments: [metadata_1.EdmTypes.String, metadata_1.EdmTypes.Int32, metadata_1.EdmTypes.Int32] }],
    //String functions
    "tolower": [{ return: metadata_1.EdmTypes.String, arguments: [metadata_1.EdmTypes.String] }],
    "toupper": [{ return: metadata_1.EdmTypes.String, arguments: [metadata_1.EdmTypes.String] }],
    "trim": [{ return: metadata_1.EdmTypes.String, arguments: [metadata_1.EdmTypes.String] }],
    //Date functions
    "date": [{ return: metadata_1.EdmTypes.Date, arguments: [metadata_1.EdmTypes.DateTimeOffset] }],
    "day": [{ return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.Date] },
        { return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.DateTimeOffset] }],
    "fractionalseconds": [{ return: metadata_1.EdmTypes.Decimal, arguments: [metadata_1.EdmTypes.DateTimeOffset] },
        { return: metadata_1.EdmTypes.Decimal, arguments: [metadata_1.EdmTypes.TimeOfDay] }],
    "hour": [{ return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.DateTimeOffset] },
        { return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.TimeOfDay] }],
    "maxdatetime": [{ return: metadata_1.EdmTypes.DateTimeOffset, arguments: [] }],
    "mindatetime": [{ return: metadata_1.EdmTypes.DateTimeOffset, arguments: [] }],
    "minute": [{ return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.DateTimeOffset] },
        { return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.TimeOfDay] }],
    "month": [{ return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.DateTimeOffset] },
        { return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.TimeOfDay] }],
    "now": [{ return: metadata_1.EdmTypes.DateTimeOffset, arguments: [] }],
    "second": [{ return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.DateTimeOffset] },
        { return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.TimeOfDay] }],
    "time": [{ return: metadata_1.EdmTypes.TimeOfDay, arguments: [metadata_1.EdmTypes.DateTimeOffset] }],
    "totaloffsetminutes": [{ return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.DateTimeOffset] }],
    "year": [{ return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.DateTimeOffset] },
        { return: metadata_1.EdmTypes.Int32, arguments: [metadata_1.EdmTypes.TimeOfDay] }],
    //Arithmetic Functions
    "celling": [{ return: metadata_1.EdmTypes.Double, arguments: [metadata_1.EdmTypes.Double] },
        { return: metadata_1.EdmTypes.Decimal, arguments: [metadata_1.EdmTypes.Decimal] }],
    "floor": [{ return: metadata_1.EdmTypes.Double, arguments: [metadata_1.EdmTypes.Double] },
        { return: metadata_1.EdmTypes.Decimal, arguments: [metadata_1.EdmTypes.Decimal] }],
    "round": [{ return: metadata_1.EdmTypes.Double, arguments: [metadata_1.EdmTypes.Double] },
        { return: metadata_1.EdmTypes.Decimal, arguments: [metadata_1.EdmTypes.Decimal] }]
};
//# sourceMappingURL=oDataQueryFuncs.js.map