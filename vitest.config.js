import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(import.meta.dirname, 'web'),
    },
  },
  test: {
    globals: true,
    include: ['test/**/*.test.js'],
    testTimeout: 15000,
    dangerouslyIgnoreUnhandledErrors: true,
    fileParallelism: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: false,
      },
    },
  },
});
