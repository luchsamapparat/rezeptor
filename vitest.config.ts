import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
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
