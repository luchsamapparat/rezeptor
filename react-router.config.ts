import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  appDirectory: 'src',
  buildDirectory: 'dist',
  future: {
    v8_middleware: true,
  },
} satisfies Config;
