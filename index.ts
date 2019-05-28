import { parse } from "acorn";
import { setParser, buildExpression } from "./filterExpressionBuilder"
import { ExtendOptions, Options, Query, CollectionSource } from "pailingual-odata";
import { ODataFunctions } from "./oDataQueryFuncs";


declare module "pailingual-odata" {
    //append $filter function override for expressions support
    export interface IEntitySetFunctionSourceBase<T> {
        $filter<TParams>(expression: FilterExpression<T, TParams>, params?: TParams): this;
    }

    export type FilterExpression<T, TParams> = (e: FilterSource<T>, p: TParams, funcs: ODataFunctions) => boolean;

    type FilterSource<T> = {
        [P in AllProps<T>]-?: T[P] extends EntityArray<infer U> | undefined ? IFilterNavigationEntitySet<U> :
        T[P] extends ComplexArray<infer U> | undefined ? IFilterNavigationEntitySet<U> :
        T[P] extends IEntityBase | IComplexBase ? Entity<T[P]> : Exclude<T[P], undefined>
    };

    interface IFilterNavigationEntitySet<T> {
        any(predicate: (d: FilterSource<T>) => boolean): boolean;
        all(predicate: (d: FilterSource<T>) => boolean): boolean;
    }
}

// add support filter expressions to CollectionSource
function $filter(this: CollectionSource, base: (expr: string) => string, expr: string | Function, params: any) {
    if (typeof expr === "function") {
        const q = this.query.filter({ func: expr as Function, params } as any);
        return new CollectionSource(this.__metadata, this.__apiMetadata, q);
    }
    return base(expr);
}

type FilterExpr = { func: Function, params?: object };

// override process filter parameter in Query
function processParameter(this: Query, base: (n: string, v: any, o: Options) => string, name: string, value: any, opt: Options): string {
    if (name == "filter")
        value = value.map((v: any) => filterToString.apply(this, [v, opt]));
    return base(name, value, opt);
}

function filterToString(this: Query, expr: string | FilterExpr, options: Options): string {
    if (typeof expr === "string")
        return expr;
    else
        return buildExpression(expr.func, expr.params || {}, this._entityMetadata, options);
}

//define plugin
export default {
    register(): ExtendOptions {
        setParser(f => parse(f, { preserveParens:true }) as any);
        return {
            collectionSourceFn: {$filter},
            queryFn: { processParameter }
        }
    }
}