interface CarTypeData {
    id: string;
    name: string;
    typeId: string;
    icon: string;
    ownershipTags: string[];
    modelId?: string;
    modelName?: string;
    colorName?: string;
}

interface CarTypeGroup {
    modelId: string;
    modelName: string;
    icon: string;
    variants: CarTypeData[];
}

interface CarSpawnProfileData {
    key: string;
    carIds: string[];
}

interface CarSpawnDatabase {
    cars: Record<string, CarTypeData>;
    spawns: Record<string, CarSpawnProfileData>;
}

export type { CarSpawnDatabase, CarSpawnProfileData, CarTypeData, CarTypeGroup };
