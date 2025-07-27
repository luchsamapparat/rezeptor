import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    target: 'esnext',
    rollupOptions: isSsrBuild
      ? { input: './src/server.ts' }
      : undefined,
  },
  plugins: [reactRouter(), tsconfigPaths()],
}));
