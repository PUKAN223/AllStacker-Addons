"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapTask = void 0;
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function wrapTask(fn) {
    return function _wrapFunction(done) {
        let origFn = fn;
        if (fn.unwrap) {
            origFn = fn.unwrap();
        }
        if (origFn.length > 0) {
            fn.call(null, done);
        }
        else {
            const results = origFn.call();
            // The result is a function, we will assume that this is a task function to be called
            if (results && typeof results === 'function') {
                return results.call(null, done);
            }
            else if (results && results.then) {
                return results;
            }
            if (typeof done === 'function') {
                done();
            }
        }
    };
}
exports.wrapTask = wrapTask;
