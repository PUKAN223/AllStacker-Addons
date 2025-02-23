"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrThrowFromProcess = void 0;
/**
 * Checks process.env for the desired key and returns the value if it exists, otherwise throws an error. Generic parameter
 * is used to ensure the correct type is returned
 *
 * @param key - The key to query from process env
 * @param message - Message to include in thrown error on failure
 * @returns Value from process env or throws an error
 */
function getOrThrowFromProcess(key, messageOverride) {
    const value = process.env[key];
    if (!value) {
        throw new Error(messageOverride ?? `Missing environment variable ${key}. Make sure to configure project.`);
    }
    return value;
}
exports.getOrThrowFromProcess = getOrThrowFromProcess;
//# sourceMappingURL=getOrThrowFromProcess.js.map