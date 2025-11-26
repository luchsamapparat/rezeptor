import { Hono } from 'hono';
import type { ApplicationContext } from '../application/server/di';
import { recipesApi } from './recipes/presentation/api/server';

export const useCasesApi = new Hono<{ Variables: ApplicationContext }>()
  .route('/', recipesApi);