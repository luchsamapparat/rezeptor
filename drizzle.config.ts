import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './database',
  schema: './src/bootstrap/databaseSchema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_CONNECTION_STRING!,
  },
});
