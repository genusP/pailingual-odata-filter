import { IEntityBase, IApiContextBase, ApiContext } from "pailingual-odata";
interface Entity extends IEntityBase { field: string }
interface Context extends IApiContextBase { entities: Entity[] }
function test() {
    var ctx: ApiContext<Context>;
    ctx.entities.$filter("PLACE-HOLDER");
}