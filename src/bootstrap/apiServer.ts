import { Hono } from 'hono';
import { values } from 'lodash-es';
import { database, documentAnalysisClient, environment, fileRepositoryFactory, fileSystem, type ApplicationContext } from '../application/server/di';
import type { Environment } from '../application/server/environment';
import { initDatabaseConnection, type Database } from '../common/persistence/database';
import { type FileSystemOperations } from '../common/server/FileSystemOperations';
import { NodeFileSystem } from '../common/server/NodeFileSystem';
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
    .use(environment.injection(env).middleware('environment'))
    .use(fileSystem.injection(fs).middleware('fileSystem'))
    .use(database<typeof databaseSchema>().injection(db).middleware('database'))
    .use(fileRepositoryFactory.middleware('fileRepositoryFactory'))
    .use(documentAnalysisClient.middleware('documentAnalysisClient'));

  values(api).forEach(apiRoute => app.route('/api', apiRoute));

  return { app, database: db };
};
