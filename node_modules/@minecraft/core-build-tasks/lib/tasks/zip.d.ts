import { CopyTaskParameters } from '.';
import { TaskFunction, parallel } from 'just-scripts';
export type ZipTaskParameters = CopyTaskParameters & {
    /**
     * The path to the output file to write the zip file to.
     */
    outputFile: string;
};
export type ZipContent = {
    /**
     * The contents to add to the zip.
     */
    contents: string[];
    /**
     * The relative path to the root. In case of provided contents are added into this folder inside the zip.
     */
    targetPath?: string;
};
/**
 * A just task which compresses files into a specified output file.
 */
export declare function zipTask(outputFile: string, zipContents: ZipContent[]): ReturnType<typeof parallel>;
/**
 * A just task which creates the mcaddon file.
 */
export declare function mcaddonTask(params: ZipTaskParameters): TaskFunction;
