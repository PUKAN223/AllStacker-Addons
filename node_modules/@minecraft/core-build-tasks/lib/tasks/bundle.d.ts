import { parallel } from 'just-scripts';
import { BuildResult } from 'esbuild';
export type BundleTaskParameters = {
    /** Initial script to be evaluated for the build. Documentation: https://esbuild.github.io/api/#entry-points */
    entryPoint: string;
    /** Packages to be considered as external. Documentation: https://esbuild.github.io/api/#external */
    external?: string[];
    /** When enabled, the generated code will be minified instead of pretty-printed. Documentation: https://esbuild.github.io/api/#minify */
    minifyWhitespace?: boolean;
    /** The output file for the bundle. Documentation: https://esbuild.github.io/api/#outfile */
    outfile: string;
    /** Flag to specify to generate a source map file. Documentation: https://esbuild.github.io/api/#sourcemap*/
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both';
    /** The output path for the source map file. Ignored if sourcemap is false or 'inline'. */
    outputSourcemapPath?: string;
};
export type PostProcessOutputFilesResult = {
    sourceMapDirectory: string;
    outputDirectory: string;
    generatedFiles: Record<string, string>;
};
export declare function postProcessOutputFiles(options: BundleTaskParameters, buildResult: BuildResult): PostProcessOutputFilesResult | undefined;
export declare function bundleTask(options: BundleTaskParameters): ReturnType<typeof parallel>;
