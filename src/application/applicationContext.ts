import { initEnvironment } from '~/application/environment';
import { initDatabaseConnection } from '~/common/persistence/database';

export async function initApplicationContext<DatabaseSchema extends Record<string, unknown>>(processEnv: NodeJS.ProcessEnv, databaseSchema: DatabaseSchema) {
  const environment = initEnvironment(processEnv);

  const database = await initDatabaseConnection({
    ...environment.database,
    schema: databaseSchema,
  });

  return {
    database,
  } as const;
}
