import { createRequestHandler } from '@react-router/express';
import { Router } from 'express';
import 'react-router';
import { cookbooksApi } from './useCases/cookbooks/server/api';
import { recipesApi } from './useCases/recipes/server/api';

export const app = Router();

app.use('/api', recipesApi, cookbooksApi);

app.use(
  createRequestHandler({
    build: () => import('virtual:react-router/server-build'),
  }),
);
