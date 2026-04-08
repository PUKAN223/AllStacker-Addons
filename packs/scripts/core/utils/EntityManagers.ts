import {
  DimensionType,
  DimensionTypes,
  Entity,
  world,
} from "npm:@minecraft/server@2.3.0";

export function getEntitiesAtDim(
  dim: string,
  filter?: (entity: Entity) => boolean,
): Entity[] {
  const entities = world.getDimension(dim).getEntities();
  if (filter) {
    return entities.filter(filter);
  }
  return entities;
}

export function getAllEntities(filter?: (entity: Entity) => boolean): Entity[] {
  const dims = DimensionTypes.getAll().map((type: DimensionType) =>
    type.typeId
  );
  const entities: Entity[] = [];
  dims.forEach((dim) => {
    entities.push(...getEntitiesAtDim(dim, filter));
  });
  return entities;
}

export function getEntityById(
  id: string,
  filter?: (entity: Entity) => boolean,
): Entity | undefined {
  const entities = world.getEntity(id);
  if (!entities) return undefined;
  if (filter && !filter(entities)) return undefined;
  return entities;
}
