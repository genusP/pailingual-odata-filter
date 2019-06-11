import { EntityArray, csdl  } from "pailingual-odata";

var PrimitiveType = csdl.PrimitiveType;
//OData protocol built-in functions
export interface ODataFunctions {
    concat<T extends string | EntityArray<any>>(left: T, right: T): T;
    contains(left: string, right: string): boolean;
    endswith(text: string, search: string): boolean;
    indexof(text: string, search: string): number;
    length(text: string): number;
    startswith(text: string, search: string): boolean;
    substring(text: string, start: number, length?: number): string;

    //String functions
    tolower(text: string): string;
    toupper(text: string): string;
    trim(text: string): string;

    //Date functions
    date(datetime: Date): Date;
    day(date: Date): number;
    fractionalseconds(date: Date): number;
    hour(date: Date): number;
    maxdatetime(): Date;
    mindatetime(): Date;
    minute(date: Date): number;
    month(date: Date): number;
    now(): Date;
    second(date: Date): number;
    time(date: Date): Date;
    totaloffsetminutes(date: Date): number;
    year(date: Date): number;

    //Arithmetic Functions
    celling(value: number): number;
    floor(value: number): number;
    round(value: number): number;
}

export type QueryFuncMetadata = { return: csdl.PrimitiveType, arguments: csdl.PrimitiveType[] };

export var ODataFunctionsMetadata: Record<string, QueryFuncMetadata[]> = {
    "concat": [{ return: PrimitiveType.String, arguments: [PrimitiveType.String, PrimitiveType.String] }],
    "contains": [{ return: PrimitiveType.Boolean, arguments: [PrimitiveType.String, PrimitiveType.String] }],
    "endswith": [{ return: PrimitiveType.Boolean, arguments: [PrimitiveType.String, PrimitiveType.String] }],
    "indexof": [{ return: PrimitiveType.Boolean, arguments: [PrimitiveType.String, PrimitiveType.String] }],
    "length": [{ return: PrimitiveType.Int32, arguments: [PrimitiveType.String] }],
    "startswith": [{ return: PrimitiveType.Boolean, arguments: [PrimitiveType.String, PrimitiveType.String] }],
    "substring": [{ return: PrimitiveType.String, arguments: [PrimitiveType.String, PrimitiveType.Int32] },
    { return: PrimitiveType.String, arguments: [PrimitiveType.String, PrimitiveType.Int32, PrimitiveType.Int32] }],

    //String functions
    "tolower": [{ return: PrimitiveType.String, arguments: [PrimitiveType.String] }],
    "toupper": [{ return: PrimitiveType.String, arguments: [PrimitiveType.String] }],
    "trim": [{ return: PrimitiveType.String, arguments: [PrimitiveType.String] }],

    //Date functions
    "date": [{ return: PrimitiveType.Date, arguments: [PrimitiveType.DateTimeOffset] }],
    "day": [{ return: PrimitiveType.Int32, arguments: [PrimitiveType.Date] },
    { return: PrimitiveType.Int32, arguments: [PrimitiveType.DateTimeOffset] }],
    "fractionalseconds": [{ return: PrimitiveType.Decimal, arguments: [PrimitiveType.DateTimeOffset] },
    { return: PrimitiveType.Decimal, arguments: [PrimitiveType.TimeOfDay] }],
    "hour": [{ return: PrimitiveType.Int32, arguments: [PrimitiveType.DateTimeOffset] },
    { return: PrimitiveType.Int32, arguments: [PrimitiveType.TimeOfDay] }],
    "maxdatetime": [{ return: PrimitiveType.DateTimeOffset, arguments: [] }],
    "mindatetime": [{ return: PrimitiveType.DateTimeOffset, arguments: [] }],
    "minute": [{ return: PrimitiveType.Int32, arguments: [PrimitiveType.DateTimeOffset] },
    { return: PrimitiveType.Int32, arguments: [PrimitiveType.TimeOfDay] }],
    "month": [{ return: PrimitiveType.Int32, arguments: [PrimitiveType.DateTimeOffset] },
    { return: PrimitiveType.Int32, arguments: [PrimitiveType.TimeOfDay] }],
    "now": [{ return: PrimitiveType.DateTimeOffset, arguments: [] }],
    "second": [{ return: PrimitiveType.Int32, arguments: [PrimitiveType.DateTimeOffset] },
    { return: PrimitiveType.Int32, arguments: [PrimitiveType.TimeOfDay] }],
    "time": [{ return: PrimitiveType.TimeOfDay, arguments: [PrimitiveType.DateTimeOffset] }],
    "totaloffsetminutes": [{ return: PrimitiveType.Int32, arguments: [PrimitiveType.DateTimeOffset] }],
    "year": [{ return: PrimitiveType.Int32, arguments: [PrimitiveType.DateTimeOffset] },
    { return: PrimitiveType.Int32, arguments: [PrimitiveType.TimeOfDay] }],

    //Arithmetic Functions
    "celling": [{ return: PrimitiveType.Double, arguments: [PrimitiveType.Double] },
    { return: PrimitiveType.Decimal, arguments: [PrimitiveType.Decimal] }],
    "floor": [{ return: PrimitiveType.Double, arguments: [PrimitiveType.Double] },
    { return: PrimitiveType.Decimal, arguments: [PrimitiveType.Decimal] }],
    "round": [{ return: PrimitiveType.Double, arguments: [PrimitiveType.Double] },
    { return: PrimitiveType.Decimal, arguments: [PrimitiveType.Decimal] }]
};