import {
  ATTR_EXCEPTION_MESSAGE,
  ATTR_EXCEPTION_STACKTRACE,
  ATTR_EXCEPTION_TYPE,
  ATTR_HTTP_ROUTE,
} from '@opentelemetry/semantic-conventions/incubating';
import { Hono } from 'hono';
import { serializeError } from 'serialize-error';
import { database, environment, fileRepositoryFactory, fileSystem, logger, type ApplicationContext } from '../application/server/di';
import type { Environment } from '../application/server/environment';
import type { Logger } from '../application/server/logging';
import { initDatabaseConnection, type Database } from '../common/persistence/database';
import { type FileSystemOperations } from '../common/server/FileSystemOperations';
import { NodeFileSystem } from '../common/server/NodeFileSystem';
import { ExternalServiceError, NotFoundError, ValidationError } from '../common/server/error';
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

  const isDevelopment = env.nodeEnv === 'development';

  const app = new Hono()
    .use(environment.injection(env).middleware('environment'))
    .use(logger.injection(rootLogger).middleware('logger'))
    .use(fileSystem.injection(fs).middleware('fileSystem'))
    .use(database<typeof databaseSchema>().injection(db).middleware('database'))
    .use(fileRepositoryFactory.middleware('fileRepositoryFactory'))
    .onError((err, c) => {
      const log = c.var.logger;

      if (err instanceof NotFoundError) {
        log.warn({
          [ATTR_EXCEPTION_TYPE]: err.constructor.name,
          [ATTR_EXCEPTION_MESSAGE]: err.message,
          [ATTR_HTTP_ROUTE]: c.req.path,
        }, 'Resource not found');
        return c.json({ error: err.message }, 404);
      }
      if (err instanceof ValidationError) {
        log.warn({
          [ATTR_EXCEPTION_TYPE]: err.constructor.name,
          [ATTR_EXCEPTION_MESSAGE]: err.message,
          [ATTR_HTTP_ROUTE]: c.req.path,
        }, 'Validation error');
        return c.json({ error: err.message }, 422);
      }
      if (err instanceof ExternalServiceError) {
        const errorResponse = err.cause instanceof Error ? serializeError(err.cause) : serializeError;
        log.error({
          [ATTR_EXCEPTION_TYPE]: err.constructor.name,
          [ATTR_EXCEPTION_MESSAGE]: err.message,
          [ATTR_HTTP_ROUTE]: c.req.path,
          cause: errorResponse,
        }, 'External service error');
        return c.json({ error: err.message, cause: errorResponse }, 500);
      }

      log.error({
        [ATTR_EXCEPTION_TYPE]: err.constructor.name,
        [ATTR_EXCEPTION_MESSAGE]: err.message,
        [ATTR_HTTP_ROUTE]: c.req.path,
        ...(isDevelopment && { [ATTR_EXCEPTION_STACKTRACE]: err.stack }),
      }, 'Unhandled error');
      return c.json({ error: 'Internal server error' }, 500);
    });

  app.route('/api', api);

  return { app, database: db };
};
