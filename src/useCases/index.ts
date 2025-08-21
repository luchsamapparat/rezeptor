import { Hono } from 'hono';
import type { ApplicationContext } from '../application/server/di';
import { recipesApi } from './recipes/server/api';
import { recipesDatabaseSchema, type RecipesDatabaseSchema } from './recipes/server/persistence/recipeDatabaseModel';

export const useCasesDatabaseSchema = { ...recipesDatabaseSchema };
export type UseCasesDatabaseSchema = RecipesDatabaseSchema;

export const useCasesApi = new Hono<{ Variables: ApplicationContext<UseCasesDatabaseSchema> }>()
  .route('/', recipesApi);