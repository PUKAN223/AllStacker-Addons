"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupEnvironment = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
/**
 * Loads the environment variables.
 * @param envPath - path to the .env file.
 */
function setupEnvironment(envPath) {
    dotenv_1.default.config({ path: envPath });
}
exports.setupEnvironment = setupEnvironment;
//# sourceMappingURL=setupEnvironment.js.map