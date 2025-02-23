import { resetEntities } from "..";
export default function getEntitiesNearBy(dimension, en, raduis = 10) {
    const allEn = dimension.getEntities({ location: en.location, maxDistance: raduis, type: en.typeId })
        .filter((x) => x.id !== en.id)
        .filter((x) => !resetEntities.has(x))
        .filter((x) => x.hasComponent("is_baby") == en.hasComponent("is_baby"))
        .filter((x) => (x.getVelocity().x + x.getVelocity().y + x.getVelocity().z) !== 0)
        .filter((x) => !x.hasComponent("is_tamed"))
        .filter((x) => !x.getComponent("leashable").leashHolder)
        .filter((x) => { var _a, _b; return ((_a = x.getComponent("color")) === null || _a === void 0 ? void 0 : _a.value) == ((_b = en.getComponent("color")) === null || _b === void 0 ? void 0 : _b.value); });
    return allEn;
}
//# sourceMappingURL=GetEntitiesNearBy.js.map