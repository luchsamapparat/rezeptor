import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  appDirectory: 'src',
  buildDirectory: 'dist',
  future: {
    unstable_middleware: true,
  },
} satisfies Config;
