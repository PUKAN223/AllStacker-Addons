import { EntityIsBabyComponent } from "@minecraft/server";
export default function spawnEntityClone(en) {
    const entityNew = en.dimension.spawnEntity(en.typeId, en.location);
    if (entityNew.hasComponent("color")) {
        entityNew.getComponent("color").value = en.getComponent("color").value;
    }
    if (en.hasComponent(EntityIsBabyComponent.componentId)) {
        try {
            entityNew.triggerEvent("minecraft:entity_born");
        }
        catch (_a) { }
    }
    else {
        try {
            entityNew.triggerEvent("minecraft:ageable_grow_up");
        }
        catch (_b) { }
    }
    return entityNew;
}
//# sourceMappingURL=SpawnEntityClone.js.map