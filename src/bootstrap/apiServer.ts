import { Hono } from 'hono';
import { database, environment, fileRepositoryFactory, fileSystem, logger, type ApplicationContext } from '../application/server/di';
import type { Environment } from '../application/server/environment';
import type { Logger } from '../application/server/logging';
import { initDatabaseConnection, type Database } from '../common/persistence/database';
import { type FileSystemOperations } from '../common/server/FileSystemOperations';
import { NodeFileSystem } from '../common/server/NodeFileSystem';
import { api } from './api';
import * as databaseSchema from './databaseSchema';

type ApiServer<DatabaseSchema extends Record<string, unknown>> = {
  app: Hono<{ Variables: ApplicationContext<DatabaseSchema> }>;
  database: Database<typeof databaseSchema>;
};

type ApiServerConfig = {
  env: Environment;
  rootLogger: Logger;
  fs?: FileSystemOperations;
};

export async function createApiServer({ env, rootLogger, fs = new NodeFileSystem() }: ApiServerConfig): Promise<ApiServer<typeof databaseSchema>> {
  const db = await initDatabaseConnection({
    ...env.database,
    schema: databaseSchema,
  });

  const app = new Hono()
    .use(environment.injection(env).middleware('environment'))
    .use(logger.injection(rootLogger).middleware('logger'))
    .use(fileSystem.injection(fs).middleware('fileSystem'))
    .use(database<typeof databaseSchema>().injection(db).middleware('database'))
    .use(fileRepositoryFactory.middleware('fileRepositoryFactory'));

  app.route('/api', api);

  return { app, database: db };
};
