import { EntityLeashableComponent } from "@minecraft/server";
import { resetEntities } from "..";
export default function getEntitiesNearBy(dimension, en, raduis = 10) {
    const allEn = dimension.getEntities({ location: en.location, maxDistance: raduis, type: en.typeId })
        .filter((x) => x.id !== en.id)
        .filter((x) => !resetEntities.has(x))
        .filter((x) => x.hasComponent("is_baby") == en.hasComponent("is_baby"))
        .filter((x) => (x.getVelocity().x + x.getVelocity().y + x.getVelocity().z) !== 0)
        .filter((x) => !x.hasComponent("is_tamed"))
        .filter((x) => {
        if (x.hasComponent(EntityLeashableComponent.componentId)) {
            const leashable = x.getComponent(EntityLeashableComponent.componentId);
            if (leashable.leashHolder)
                return false;
        }
        return true;
    })
        .filter((x) => { var _a, _b; return ((_a = x.getComponent("color")) === null || _a === void 0 ? void 0 : _a.value) == ((_b = en.getComponent("color")) === null || _b === void 0 ? void 0 : _b.value); })
        .filter((x) => {
        if ((x.nameTag && en.nameTag) && (x.nameTag.includes("§m§r§c") && en.nameTag.includes("§m§r§c")))
            return true;
        if (!(x.nameTag && en.nameTag))
            return true;
        return false;
    });
    return allEn;
}
//# sourceMappingURL=GetEntitiesNearBy.js.map