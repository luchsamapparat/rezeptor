import { createRequestHandler } from '@react-router/express';
import { json, Router } from 'express';
import { values } from 'lodash-es';
import { initApplicationContext } from '../application/applicationContext';
import { type Environment } from '../application/environment';
import { applicationContextMiddleware } from '../application/server/applicationContextStore';
import { api } from './api';
import { databaseSchema } from './databaseSchema';

export async function createServer(environment: Environment) {
  const applicationContext = await initApplicationContext(environment, databaseSchema);

  const app = Router();

  app.use(json());

  app.use(applicationContextMiddleware(applicationContext));

  app.use('/api', ...values(api));

  app.use(
    createRequestHandler({
      build: () => import('virtual:react-router/server-build'),
    }),
  );

  return { app, database: applicationContext.database };
};
