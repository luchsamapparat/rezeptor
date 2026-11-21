import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules'],
    globalSetup: './src/tests/globalSetup.ts',
    setupFiles: ['./src/tests/setup.ts'],
    clearMocks: true,
    pool: 'forks',
    maxWorkers: 1,
  },
});
