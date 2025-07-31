import { DimensionTypes, world } from "@minecraft/server";
export function getEntitiesAtDim(dim, filter) {
    const entities = world.getDimension(dim).getEntities();
    if (filter) {
        return entities.filter(filter);
    }
    return entities;
}
export function getAllEntities(filter) {
    const dims = DimensionTypes.getAll().map((type) => type.typeId);
    const entities = [];
    dims.forEach(dim => {
        entities.push(...getEntitiesAtDim(dim, filter));
    });
    return entities;
}
export function getEntityById(id, filter) {
    const entities = world.getEntity(id);
    if (!entities)
        return undefined;
    if (filter && !filter(entities))
        return undefined;
    return entities;
}
//# sourceMappingURL=EntityManagers.js.map