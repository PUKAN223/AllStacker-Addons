"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiExtractorTask = void 0;
const api_extractor_1 = require("@microsoft/api-extractor");
/**
 * A just task which executes API extractor based on the api-extractor.json configuration in the root of a package.
 * @param jsonFile - the api-extractor.json file to use
 * @beta
 */
function apiExtractorTask(jsonFile, localBuild) {
    return () => {
        console.log(`Running a ${localBuild ? 'local' : 'production'} api extractor build.`);
        const apiExtractorJsonPath = jsonFile;
        const extractorConfig = api_extractor_1.ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath);
        const extractorResult = api_extractor_1.Extractor.invoke(extractorConfig, {
            // Equivalent to the "--local" command-line parameter
            localBuild,
            // Equivalent to the "--verbose" command-line parameter
            showVerboseMessages: true,
        });
        if (extractorResult.succeeded) {
            console.log(`API Extractor completed successfully`);
            process.exitCode = 0;
            return Promise.resolve();
        }
        const message = `API Extractor did not complete successfully. ${extractorResult.errorCount} errors found and ${extractorResult.warningCount} warnings found. These must be addressed for the test to succeed.`;
        console.error(message);
        process.exitCode = 1;
        return Promise.reject(new Error(message));
    };
}
exports.apiExtractorTask = apiExtractorTask;
//# sourceMappingURL=api-extractor.js.map