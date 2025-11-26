import { Hono } from 'hono';
import { isUndefined } from 'lodash-es';
import { database, environment, fileRepositoryFactory, fileSystem, logger } from '../application/server/di';
import type { Environment } from '../application/server/environment';
import { createErrorHandler } from '../application/server/errorHandling';
import type { Logger } from '../application/server/logging';
import type { DatabaseClient } from '../common/persistence/database';
import { type FileSystemOperations } from '../common/server/FileSystemOperations';
import { NodeFileSystem } from '../common/server/NodeFileSystem';
import { api } from './api';

type ApiServerConfig = {
  env: Environment;
  rootLogger: Logger;
  database?: DatabaseClient;
  fileSystem?: FileSystemOperations;
};

export async function createApiServer({ env, rootLogger, database: db, fileSystem: fs = new NodeFileSystem() }: ApiServerConfig) {
  const app = new Hono()
    .use(environment.injection(env).middleware('environment'))
    .use(logger.injection(rootLogger).middleware('logger'))
    .use(isUndefined(db) ? database.middleware('database') : database.injection(db).middleware('database'))
    .use(fileSystem.injection(fs).middleware('fileSystem'))
    .use(fileRepositoryFactory.middleware('fileRepositoryFactory'));

  app.onError(createErrorHandler(rootLogger));

  app.route('/api', api);

  return app;
};
