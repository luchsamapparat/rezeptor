import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'database/schema.prisma',
  migrations: {
    path: 'database/migrations',
  },
  views: {
    path: 'database/views',
  },
  typedSql: {
    path: 'database/queries',
  },
});