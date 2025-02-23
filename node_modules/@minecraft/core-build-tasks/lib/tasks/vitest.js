"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.vitestTask = void 0;
const child_process_1 = require("child_process");
function vitestTask() {
    return () => {
        (0, child_process_1.execSync)('vitest', { stdio: 'inherit' });
    };
}
exports.vitestTask = vitestTask;
//# sourceMappingURL=vitest.js.map