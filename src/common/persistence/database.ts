import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

export type DatabaseConfiguration<Schema extends Record<string, unknown>> = {
  connectionString: string;
  migrationsPath: string;
  schema: Schema;
};

export async function initDatabaseConnection<Schema extends Record<string, unknown>>({ connectionString, migrationsPath, schema }: DatabaseConfiguration<Schema>) {
  const client = createClient({ url: connectionString });
  const database = drizzle(client, { schema });
  await migrate(database, { migrationsFolder: migrationsPath });
  return database;
}

export type Database<Schema extends Record<string, unknown> = Record<string, unknown>> = Awaited<ReturnType<typeof initDatabaseConnection<Schema>>>;
