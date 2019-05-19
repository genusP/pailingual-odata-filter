import { IEntityBase, IApiContextBase, ApiContext } from "pailingual-odata";
//Namespace.Entity
interface Entity extends IEntityBase { field: string }
interface Context extends IApiContextBase { entities: Entity[] }
function test() {
    ({}as ApiContext<Context>).entities.$filter(e=>e.field==="1");
}