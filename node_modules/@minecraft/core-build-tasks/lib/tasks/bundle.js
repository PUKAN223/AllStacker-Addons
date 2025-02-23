"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundleTask = exports.postProcessOutputFiles = void 0;
const esbuild_1 = __importDefault(require("esbuild"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const MAP_EXTENSION = '.map';
function isRequiredToMakeAnyFileChange(sourcemap) {
    return sourcemap !== false && sourcemap !== 'inline';
}
function isRequiredToLinkJsFile(sourcemap) {
    return sourcemap === true || sourcemap === 'linked';
}
function linkSourceMaps(sourceMapDirectory, outputDirectory, options, outputFiles) {
    const generatedFiles = {};
    for (const element of outputFiles) {
        if (element.path.endsWith(MAP_EXTENSION)) {
            const parsedPath = path_1.default.parse(element.path);
            const sourceMapFilePath = path_1.default.join(sourceMapDirectory, parsedPath.base);
            const sourceMapContent = JSON.parse(element.text);
            // Add JS file location.
            sourceMapContent.file = path_1.default
                .relative(sourceMapDirectory, path_1.default.join(outputDirectory, parsedPath.name))
                .replace(/\\/g, '/');
            generatedFiles[sourceMapFilePath] = JSON.stringify(sourceMapContent);
        }
        else if (isRequiredToLinkJsFile(options.sourcemap)) {
            // Link to the source map file.
            const dir = path_1.default.parse(element.path).dir;
            const targetSourceMap = path_1.default
                .join(path_1.default.relative(dir, sourceMapDirectory), path_1.default.parse(element.path).base)
                .replace(/\\/g, '/');
            generatedFiles[element.path] = element.text + `\n//# sourceMappingURL=${targetSourceMap}${MAP_EXTENSION}\n`;
        }
        else {
            generatedFiles[element.path] = element.text;
        }
    }
    return generatedFiles;
}
function writeFiles(postProcessOutputFilesResult) {
    fs_1.default.mkdirSync(postProcessOutputFilesResult.outputDirectory, { recursive: true });
    if (postProcessOutputFilesResult.sourceMapDirectory !== postProcessOutputFilesResult.outputDirectory) {
        fs_1.default.mkdirSync(postProcessOutputFilesResult.sourceMapDirectory, { recursive: true });
    }
    for (const path of Object.keys(postProcessOutputFilesResult.generatedFiles)) {
        fs_1.default.writeFileSync(path, postProcessOutputFilesResult.generatedFiles[path]);
    }
}
function postProcessOutputFiles(options, buildResult) {
    if (!buildResult.outputFiles) {
        return undefined;
    }
    const outputDirectory = path_1.default.parse(options.outfile).dir;
    const sourceMapDirectory = path_1.default.resolve(options.outputSourcemapPath ?? outputDirectory);
    const generatedFiles = linkSourceMaps(sourceMapDirectory, outputDirectory, options, buildResult.outputFiles);
    return { sourceMapDirectory, outputDirectory, generatedFiles: generatedFiles };
}
exports.postProcessOutputFiles = postProcessOutputFiles;
function bundleTask(options) {
    return () => {
        const isRequiredToMakeChanges = isRequiredToMakeAnyFileChange(options.sourcemap);
        const isRequiredToLinkJs = isRequiredToLinkJsFile(options.sourcemap);
        const buildResult = esbuild_1.default.buildSync({
            entryPoints: [options.entryPoint],
            bundle: true,
            format: 'esm',
            minifyWhitespace: options.minifyWhitespace,
            outfile: options.outfile,
            sourcemap: isRequiredToLinkJs ? 'external' : options.sourcemap,
            external: options.external,
            write: !isRequiredToMakeChanges,
        });
        if (buildResult.errors.length === 0) {
            if (isRequiredToMakeChanges) {
                if (!buildResult.outputFiles) {
                    process.exitCode = 1;
                    return Promise.reject(new Error('No output files were generated, check that your entrypoint file is configured correctly.'));
                }
                const result = postProcessOutputFiles(options, buildResult);
                if (result) {
                    writeFiles(result);
                }
            }
            process.exitCode = 0;
            return Promise.resolve();
        }
        process.exitCode = 1;
        return Promise.reject(new Error(buildResult.errors.join('\n')));
    };
}
exports.bundleTask = bundleTask;
//# sourceMappingURL=bundle.js.map