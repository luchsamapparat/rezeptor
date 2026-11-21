import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { reactRouterHonoServer } from 'react-router-hono-server/dev';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    target: 'esnext',
  },
  plugins: [
    reactRouterHonoServer({
      serverEntryPoint: 'src/index.ts',
    }),
    tailwindcss(),
    reactRouter(),
  ],
});
