import { EntityArray } from "pailingual-odata";
import { EdmTypes } from "pailingual-odata/src/metadata";

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

export type QueryFuncMetadata = { return: EdmTypes, arguments: EdmTypes[] };

export var ODataFunctionsMetadata: Record<string, QueryFuncMetadata[]> = {
    "concat": [{ return: EdmTypes.String, arguments: [EdmTypes.String, EdmTypes.String] }],
    "contains": [{ return: EdmTypes.Boolean, arguments: [EdmTypes.String, EdmTypes.String] }],
    "endswith": [{ return: EdmTypes.Boolean, arguments: [EdmTypes.String, EdmTypes.String] }],
    "indexof": [{ return: EdmTypes.Boolean, arguments: [EdmTypes.String, EdmTypes.String] }],
    "length": [{ return: EdmTypes.Int32, arguments: [EdmTypes.String] }],
    "startswith": [{ return: EdmTypes.Boolean, arguments: [EdmTypes.String, EdmTypes.String] }],
    "substring": [{ return: EdmTypes.String, arguments: [EdmTypes.String, EdmTypes.Int32] },
    { return: EdmTypes.String, arguments: [EdmTypes.String, EdmTypes.Int32, EdmTypes.Int32] }],

    //String functions
    "tolower": [{ return: EdmTypes.String, arguments: [EdmTypes.String] }],
    "toupper": [{ return: EdmTypes.String, arguments: [EdmTypes.String] }],
    "trim": [{ return: EdmTypes.String, arguments: [EdmTypes.String] }],

    //Date functions
    "date": [{ return: EdmTypes.Date, arguments: [EdmTypes.DateTimeOffset] }],
    "day": [{ return: EdmTypes.Int32, arguments: [EdmTypes.Date] },
    { return: EdmTypes.Int32, arguments: [EdmTypes.DateTimeOffset] }],
    "fractionalseconds": [{ return: EdmTypes.Decimal, arguments: [EdmTypes.DateTimeOffset] },
    { return: EdmTypes.Decimal, arguments: [EdmTypes.TimeOfDay] }],
    "hour": [{ return: EdmTypes.Int32, arguments: [EdmTypes.DateTimeOffset] },
    { return: EdmTypes.Int32, arguments: [EdmTypes.TimeOfDay] }],
    "maxdatetime": [{ return: EdmTypes.DateTimeOffset, arguments: [] }],
    "mindatetime": [{ return: EdmTypes.DateTimeOffset, arguments: [] }],
    "minute": [{ return: EdmTypes.Int32, arguments: [EdmTypes.DateTimeOffset] },
    { return: EdmTypes.Int32, arguments: [EdmTypes.TimeOfDay] }],
    "month": [{ return: EdmTypes.Int32, arguments: [EdmTypes.DateTimeOffset] },
    { return: EdmTypes.Int32, arguments: [EdmTypes.TimeOfDay] }],
    "now": [{ return: EdmTypes.DateTimeOffset, arguments: [] }],
    "second": [{ return: EdmTypes.Int32, arguments: [EdmTypes.DateTimeOffset] },
    { return: EdmTypes.Int32, arguments: [EdmTypes.TimeOfDay] }],
    "time": [{ return: EdmTypes.TimeOfDay, arguments: [EdmTypes.DateTimeOffset] }],
    "totaloffsetminutes": [{ return: EdmTypes.Int32, arguments: [EdmTypes.DateTimeOffset] }],
    "year": [{ return: EdmTypes.Int32, arguments: [EdmTypes.DateTimeOffset] },
    { return: EdmTypes.Int32, arguments: [EdmTypes.TimeOfDay] }],

    //Arithmetic Functions
    "celling": [{ return: EdmTypes.Double, arguments: [EdmTypes.Double] },
    { return: EdmTypes.Decimal, arguments: [EdmTypes.Decimal] }],
    "floor": [{ return: EdmTypes.Double, arguments: [EdmTypes.Double] },
    { return: EdmTypes.Decimal, arguments: [EdmTypes.Decimal] }],
    "round": [{ return: EdmTypes.Double, arguments: [EdmTypes.Double] },
    { return: EdmTypes.Decimal, arguments: [EdmTypes.Decimal] }]
};