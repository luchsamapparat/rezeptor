import { Hono } from 'hono';
import { cookbookApi } from './cookbookApi';
import { recipeApi } from './recipeApi';

export const recipesApi = new Hono()
  .route('/', cookbookApi)
  .route('/', recipeApi);