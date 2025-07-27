import { createRequestHandler } from '@react-router/express';
import { Router } from 'express';
import { values } from 'lodash-es';
import { initApplicationContext } from '~/application/applicationContext';
import { applicationContextMiddleware } from '~/application/server/applicationContextStore';
import * as useCases from './useCases';

export const app = Router();

app.use(applicationContextMiddleware(await initApplicationContext(process.env, useCases.databaseSchema)));

app.use('/api', ...values(useCases.api));

app.use(
  createRequestHandler({
    build: () => import('virtual:react-router/server-build'),
  }),
);
