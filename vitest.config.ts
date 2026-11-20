import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit tests only — `tests/site.spec.ts` is the Playwright e2e suite
    // (run via `npm run test:e2e`), not unit tests.
    include: ['tests/unit/**/*.test.js'],
    // `.dev-data/store.json` is shared mutable state between unit test files —
    // keep them sequential so the file store doesn't race across workers.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
