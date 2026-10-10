"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
(0, globals_1.afterEach)(() => {
    console.log(`PASS ${globals_1.expect.getState().currentTestName}`);
});
//# sourceMappingURL=test.setup.js.map