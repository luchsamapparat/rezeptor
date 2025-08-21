import { Hono } from 'hono';
import { database, environment, fileRepositoryFactory, fileSystem, type ApplicationContext } from '../application/server/di';
import type { Environment } from '../application/server/environment';
import { initDatabaseConnection, type Database } from '../common/persistence/database';
import { type FileSystemOperations } from '../common/server/FileSystemOperations';
import { NodeFileSystem } from '../common/server/NodeFileSystem';
import { NotFoundError, ValidationError } from '../common/server/error';
import { api } from './api';
import { databaseSchema } from './databaseSchema';

type ApiServer<DatabaseSchema extends Record<string, unknown>> = {
  app: Hono<{ Variables: ApplicationContext<DatabaseSchema> }>;
  database: Database<typeof databaseSchema>;
};

export async function createApiServer(env: Environment, fs: FileSystemOperations = new NodeFileSystem()): Promise<ApiServer<typeof databaseSchema>> {
  const db = await initDatabaseConnection({
    ...env.database,
    schema: databaseSchema,
  });

  const app = new Hono()
    .onError((err, c) => {
      if (err instanceof NotFoundError) {
        return c.json({ error: err.message }, 404);
      }
      if (err instanceof ValidationError) {
        return c.json({ error: err.message }, 422);
      }
      console.error('Unhandled error:', err);
      return c.json({ error: 'Internal server error' }, 500);
    })
    .use(environment.injection(env).middleware('environment'))
    .use(fileSystem.injection(fs).middleware('fileSystem'))
    .use(database<typeof databaseSchema>().injection(db).middleware('database'))
    .use(fileRepositoryFactory.middleware('fileRepositoryFactory'));

  app.route('/api', api);

  return { app, database: db };
};
