import { initDatabaseConnection } from '../common/persistence/database';
import { type Environment } from './environment';

export async function initApplicationContext<DatabaseSchema extends Record<string, unknown>>(environment: Environment, databaseSchema: DatabaseSchema) {
  const database = await initDatabaseConnection({
    ...environment.database,
    schema: databaseSchema,
  });

  return {
    database,
  } as const;
}

export type ApplicationContext<
  DatabaseSchema extends Record<string, unknown> = Record<string, unknown>,
> = Awaited<ReturnType<typeof initApplicationContext<DatabaseSchema>>>;
