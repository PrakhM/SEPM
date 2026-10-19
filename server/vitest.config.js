import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    passWithNoTests: true,
    // The integration tests hit a real Postgres in another region, so a
    // single request can take a couple of seconds of pure network latency.
    // The default 5s is not enough for the multi-request flows.
    testTimeout: 30000,
  },
});
