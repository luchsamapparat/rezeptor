import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'database/schema.prisma',
  migrations: {
    path: 'database/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
