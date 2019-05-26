# Pailingual-Odata-Filter
Plugin for [Pailingual-OData](https://github.com/geniusP/pailingual-odata) offering a simple and type-safe filtering expression

# Install
```bash
npm --save pailingual-odata-filter
```

# Usage

Before create instance ApiContext you must initialize plugin:
```ts
import Pailingual from "pailingual-odata";
import FilterPlugin from "pailingual-odata-filter";

Pailingual.use(FilterPlugin);
```

This plugin add override $filter function for support arrow-function expression.
Expression takes 3 parameters:
  1. Filtrable entity
  2. Parameters
  3. List of builtin OData funcs
  
```ts
//simle filter
ctx.Parents.$filter(e=> e.id === 1);

//filter with parameter
let maxId =10;
ctx.Parent.$filter((e, p) => e.id <== p.maxId, { maxId })

//use Odata functions
ctx.Parent.$filter((e, p, f) => f.endsWith( e.stringField, '.txt'))

//lambda funcs
ctx.Parent.$filter(e=>e.childs.any(c=>c.childField === "test"))
```

# AOT
Plugin implement custom tranformation for transform expressions to string. As result not need execute parsing expression on runtime.
You can use transform with awesome-typescript-loader or ts-loader

```ts
//webpack.config.js
const pailingualFilterTransform = require("pailingual-odata-filter/pailingualFilterTransform");
....
rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
         options: {
            getCustomTransformers: program => ({
                before: argv.mode !== "production"
                  ? [ pailingualFilterTransform(program) ]
                  : []
            })
        }

      }
    ]
...

//app.ts
import Pailingual from "pailingual-odata";
import FilterPlugin from "pailingual-odata-filter";

//No need register plugin in production mode, all expression transforms to string
if (process.env.NODE_ENV !== "production")
    Pailingual.use(FilterPlugin);

```

