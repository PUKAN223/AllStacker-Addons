"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWorldTask = void 0;
const just_scripts_1 = require("just-scripts");
const clean_1 = require("./clean");
const helpers_1 = require("./helpers");
const node_core_library_1 = require("@rushstack/node-core-library");
const path_1 = __importDefault(require("path"));
/**
 * A just task which updates the world in the game from the development path. Original world is backed up.
 */
function updateWorldTask(params) {
    const targetWorldPath = path_1.default.resolve((0, helpers_1.getTargetWorldPath)());
    (0, just_scripts_1.task)('clean_localmc_world_backup', (0, clean_1.cleanTask)([params.backupPath]));
    (0, just_scripts_1.task)('backup_localmc_world', () => (0, helpers_1.copyFiles)([targetWorldPath], params.backupPath));
    (0, just_scripts_1.task)('clean_localmc_world', (0, clean_1.cleanTask)([targetWorldPath]));
    (0, just_scripts_1.task)('deploy_localmc_world', () => (0, helpers_1.copyFiles)([params.devWorldPath], targetWorldPath));
    return (0, just_scripts_1.series)('clean_localmc_world_backup', (0, just_scripts_1.condition)('backup_localmc_world', () => node_core_library_1.FileSystem.exists(targetWorldPath)), 'clean_localmc_world', 'deploy_localmc_world');
}
exports.updateWorldTask = updateWorldTask;
//# sourceMappingURL=updateWorld.js.map