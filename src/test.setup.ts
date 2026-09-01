import { afterEach, expect } from '@jest/globals';

afterEach(() => {
  console.log(`PASS ${expect.getState().currentTestName}`);
});