export interface Manifest {
    format_version: number;
    header: ManifestHeader;
    modules: ManifestModule[];
    dependencies?: ManifestDependency[];
    subpacks?: Subpack[];
    capabilities?: string[];
}

export type Version = [number, number, number];
export type UUID = string;

export interface ManifestHeader {
    name: string;
    description: string;
    uuid: UUID;
    version: Version;
    min_engine_version: Version;
    lock_template?: boolean;
}

export interface ManifestModule {
    uuid: UUID;
    version: Version;
    type: ModuleType;
    description?: string;
    language?: string;
}

export type ModuleType =
    | 'resources' // Resource Pack content
    | 'data'      // Behavior Pack content (Scripts, Loot Tables, etc.)
    | 'skin_pack' // Skin Pack content
    | 'interface' // UI content
    | 'world_template'
    | 'script'    // Client-side scripting
    | 'resource'  // Legacy name for 'resources'
    | 'client_data' // Client-side behavior (e.g., animations, render controllers)
    | 'world_dependencies';

export interface ManifestDependency {
    uuid: UUID;
    version: Version;
}

export interface Subpack {
    folder_name: string;
    name: string;
}