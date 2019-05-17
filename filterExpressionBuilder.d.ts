import { EdmEntityType } from "./metadata";
import { Options } from "./options";
declare type ParserDelegate = (fragment: string) => any;
export declare function setParser(parser: ParserDelegate): void;
export declare function buildExpression(func: Function, params: object, metadata: EdmEntityType, options: Options): string;
export {};
