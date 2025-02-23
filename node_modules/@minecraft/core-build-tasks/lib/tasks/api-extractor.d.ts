/**
 * A just task which executes API extractor based on the api-extractor.json configuration in the root of a package.
 * @param jsonFile - the api-extractor.json file to use
 * @beta
 */
export declare function apiExtractorTask(jsonFile: string, localBuild: boolean): () => Promise<void>;
