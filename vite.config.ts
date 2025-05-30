import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    rollupOptions: isSsrBuild
      ? {
          input: './src/server/app.ts',
        }
      : undefined,
  },
  plugins: [reactRouter(), tsconfigPaths()],
}));
