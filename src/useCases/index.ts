import { Hono } from 'hono';
import type { ApplicationContext } from '../application/server/di';
import { cookbooksApi } from './cookbooks/server/api';
import { cookbooksDatabaseSchema, type CookbooksDatabaseSchema } from './cookbooks/server/persistence/cookbookDatabaseModel';
import { recipesApi } from './recipes/server/api';
import { recipesDatabaseSchema, type RecipesDatabaseSchema } from './recipes/server/persistence/recipeDatabaseModel';

export const useCasesDatabaseSchema = { ...cookbooksDatabaseSchema, ...recipesDatabaseSchema };
export type UseCasesDatabaseSchema = CookbooksDatabaseSchema & RecipesDatabaseSchema;

export const useCasesApi = new Hono<{ Variables: ApplicationContext<UseCasesDatabaseSchema> }>()
  .route('/', cookbooksApi)
  .route('/', recipesApi);