export declare const STANDARD_CLEAN_PATHS: string[];
/**
 * Cleans the specified outputs. Outputs could be either folders or files. Has support for the following variable replacements
 *
 *   APPDATA, LOCALAPPDATA, PROJECT_NAME
 *
 * This constant is replaced at task execution with a value provided by the process environment.
 *
 */
export declare function cleanCollateralTask(pathsToClean: string[]): () => void;
