"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const bundle_1 = require("./bundle");
const path_1 = __importDefault(require("path"));
function _createParameters(sourcemap, outputFile, outputSourcemapPath) {
    return {
        options: {
            entryPoint: '',
            outfile: outputFile,
            sourcemap: sourcemap,
            outputSourcemapPath: outputSourcemapPath,
        },
        buildResult: {
            outputFiles: [
                { path: outputFile, contents: new Uint8Array(), hash: '', text: '' },
                {
                    path: 'main.js.map',
                    contents: new Uint8Array(),
                    hash: '',
                    text: '{"version":3,"sources":["../../scripts/main.ts"],"sourcesContent":[""],"mappings":";AAAA,SAAS,OAAO;","names":[]}',
                },
            ],
            errors: [],
            warnings: [],
            metafile: { inputs: {}, outputs: {} },
            mangleCache: {},
        },
    };
}
(0, vitest_1.describe)('postProcessOutputFiles with source map files at different path', () => {
    (0, vitest_1.it)('sourcemap `true` - Dictionary populated correctly', () => {
        const sourcemap = true;
        const debugPath = path_1.default.resolve('./dist/debug');
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path_1.default.resolve('./dist/debug');
        const expectedOutputDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path_1.default.resolve('./dist/debug/main.js.map');
        const expectedSourceMappingURL = '\n//# sourceMappingURL=../debug/main.js.map\n';
        const expectedSourceMapFile = '../scripts/main.js';
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeDefined();
        if (result) {
            (0, vitest_1.expect)(result.outputDirectory).toBe(expectedOutputDirectory);
            (0, vitest_1.expect)(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            (0, vitest_1.expect)(Object.keys(result.generatedFiles).length).toBe(2);
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            (0, vitest_1.expect)(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]);
            (0, vitest_1.expect)(sourceMap).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    (0, vitest_1.it)('sourcemap `linked` - Dictionary populated correctly', () => {
        const sourcemap = 'linked';
        const debugPath = path_1.default.resolve('./dist/debug');
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path_1.default.resolve('./dist/debug');
        const expectedOutputDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path_1.default.resolve('./dist/debug/main.js.map');
        const expectedSourceMappingURL = '\n//# sourceMappingURL=../debug/main.js.map\n';
        const expectedSourceMapFile = '../scripts/main.js';
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeDefined();
        if (result) {
            (0, vitest_1.expect)(result.outputDirectory).toBe(expectedOutputDirectory);
            (0, vitest_1.expect)(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            (0, vitest_1.expect)(Object.keys(result.generatedFiles).length).toBe(2);
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            (0, vitest_1.expect)(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]);
            (0, vitest_1.expect)(sourceMap).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    (0, vitest_1.it)('sourcemap `external` - Dictionary populated correctly', () => {
        const sourcemap = 'external';
        const debugPath = path_1.default.resolve('./dist/debug');
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path_1.default.resolve('./dist/debug');
        const expectedOutputDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path_1.default.resolve('./dist/debug/main.js.map');
        const expectedSourceMappingURL = '';
        const expectedSourceMapFile = '../scripts/main.js';
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeDefined();
        if (result) {
            (0, vitest_1.expect)(result.outputDirectory).toBe(expectedOutputDirectory);
            (0, vitest_1.expect)(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            (0, vitest_1.expect)(Object.keys(result.generatedFiles).length).toBe(2);
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            (0, vitest_1.expect)(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]);
            (0, vitest_1.expect)(sourceMap).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    (0, vitest_1.it)('sourcemap `both` - Dictionary populated correctly', () => {
        const sourcemap = 'both';
        const debugPath = path_1.default.resolve('./dist/debug');
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path_1.default.resolve('./dist/debug');
        const expectedOutputDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path_1.default.resolve('./dist/debug/main.js.map');
        const expectedSourceMappingURL = '';
        const expectedSourceMapFile = '../scripts/main.js';
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeDefined();
        if (result) {
            (0, vitest_1.expect)(result.outputDirectory).toBe(expectedOutputDirectory);
            (0, vitest_1.expect)(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            (0, vitest_1.expect)(Object.keys(result.generatedFiles).length).toBe(2);
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            (0, vitest_1.expect)(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]);
            (0, vitest_1.expect)(sourceMap).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    (0, vitest_1.it)('sourcemap `inline` - Dictionary populated correctly', () => {
        const sourcemap = 'inline';
        const debugPath = path_1.default.resolve('./dist/debug');
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path_1.default.resolve('./dist/debug');
        const expectedOutputDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path_1.default.resolve('./dist/debug/main.js.map');
        const expectedSourceMappingURL = '';
        const expectedSourceMapFile = '../scripts/main.js';
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeDefined();
        if (result) {
            (0, vitest_1.expect)(result.outputDirectory).toBe(expectedOutputDirectory);
            (0, vitest_1.expect)(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            (0, vitest_1.expect)(Object.keys(result.generatedFiles).length).toBe(2);
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            (0, vitest_1.expect)(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]);
            (0, vitest_1.expect)(sourceMap).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
});
(0, vitest_1.describe)('postProcessOutputFiles with source map files at same path', () => {
    (0, vitest_1.it)('sourcemap `true` - Dictionary populated correctly using undefined', () => {
        const sourcemap = true;
        const debugPath = undefined;
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path_1.default.resolve('./dist/scripts/main.js.map');
        const expectedSourceMappingURL = '\n//# sourceMappingURL=main.js.map\n';
        const expectedSourceMapFile = 'main.js';
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeDefined();
        if (result) {
            (0, vitest_1.expect)(result.outputDirectory).toBe(expectedOutputDirectory);
            (0, vitest_1.expect)(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            (0, vitest_1.expect)(Object.keys(result.generatedFiles).length).toBe(2);
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            (0, vitest_1.expect)(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]);
            (0, vitest_1.expect)(sourceMap).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    (0, vitest_1.it)('sourcemap `true` - Dictionary populated correctly using same path explicitly', () => {
        const sourcemap = true;
        const debugPath = path_1.default.resolve('./dist/scripts');
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path_1.default.resolve('./dist/scripts/main.js.map');
        const expectedSourceMappingURL = '\n//# sourceMappingURL=main.js.map\n';
        const expectedSourceMapFile = 'main.js';
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeDefined();
        if (result) {
            (0, vitest_1.expect)(result.outputDirectory).toBe(expectedOutputDirectory);
            (0, vitest_1.expect)(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            (0, vitest_1.expect)(Object.keys(result.generatedFiles).length).toBe(2);
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            (0, vitest_1.expect)(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]);
            (0, vitest_1.expect)(sourceMap).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    (0, vitest_1.it)('sourcemap `linked` - Dictionary populated correctly using undefined', () => {
        const sourcemap = 'linked';
        const debugPath = undefined;
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path_1.default.resolve('./dist/scripts/main.js.map');
        const expectedSourceMappingURL = '\n//# sourceMappingURL=main.js.map\n';
        const expectedSourceMapFile = 'main.js';
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeDefined();
        if (result) {
            (0, vitest_1.expect)(result.outputDirectory).toBe(expectedOutputDirectory);
            (0, vitest_1.expect)(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            (0, vitest_1.expect)(Object.keys(result.generatedFiles).length).toBe(2);
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            (0, vitest_1.expect)(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]);
            (0, vitest_1.expect)(sourceMap).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    (0, vitest_1.it)('sourcemap `external` - Dictionary populated correctly using undefined', () => {
        const sourcemap = 'external';
        const debugPath = undefined;
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path_1.default.resolve('./dist/scripts/main.js.map');
        const expectedSourceMappingURL = '';
        const expectedSourceMapFile = 'main.js';
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeDefined();
        if (result) {
            (0, vitest_1.expect)(result.outputDirectory).toBe(expectedOutputDirectory);
            (0, vitest_1.expect)(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            (0, vitest_1.expect)(Object.keys(result.generatedFiles).length).toBe(2);
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            (0, vitest_1.expect)(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]);
            (0, vitest_1.expect)(sourceMap).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    (0, vitest_1.it)('sourcemap `both` - Dictionary populated correctly using undefined', () => {
        const sourcemap = 'both';
        const debugPath = undefined;
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path_1.default.resolve('./dist/scripts/main.js.map');
        const expectedSourceMappingURL = '';
        const expectedSourceMapFile = 'main.js';
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeDefined();
        if (result) {
            (0, vitest_1.expect)(result.outputDirectory).toBe(expectedOutputDirectory);
            (0, vitest_1.expect)(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            (0, vitest_1.expect)(Object.keys(result.generatedFiles).length).toBe(2);
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            (0, vitest_1.expect)(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]);
            (0, vitest_1.expect)(sourceMap).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    (0, vitest_1.it)('sourcemap `inline` - Dictionary populated correctly using undefined', () => {
        const sourcemap = 'inline';
        const debugPath = undefined;
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputDirectory = path_1.default.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path_1.default.resolve('./dist/scripts/main.js.map');
        const expectedSourceMappingURL = '';
        const expectedSourceMapFile = 'main.js';
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeDefined();
        if (result) {
            (0, vitest_1.expect)(result.outputDirectory).toBe(expectedOutputDirectory);
            (0, vitest_1.expect)(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            (0, vitest_1.expect)(Object.keys(result.generatedFiles).length).toBe(2);
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            (0, vitest_1.expect)(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            (0, vitest_1.expect)(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]);
            (0, vitest_1.expect)(sourceMap).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBeDefined();
            (0, vitest_1.expect)(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
});
(0, vitest_1.describe)('postProcessOutputFiles with no files', () => {
    (0, vitest_1.it)('sourcemap `true` - Returns undefined', () => {
        const sourcemap = true;
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, undefined);
        parameters.buildResult.outputFiles = undefined;
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeUndefined();
    });
    (0, vitest_1.it)('sourcemap `false` - Returns undefined', () => {
        const sourcemap = false;
        const outputFile = path_1.default.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, undefined);
        parameters.buildResult.outputFiles = undefined;
        const result = (0, bundle_1.postProcessOutputFiles)(parameters.options, parameters.buildResult);
        (0, vitest_1.expect)(result).toBeUndefined();
    });
});
//# sourceMappingURL=bundle.test.js.map