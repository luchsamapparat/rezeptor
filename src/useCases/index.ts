import { Hono } from 'hono';
import type { ApplicationContext } from '../application/server/di';
import { recipesDatabaseSchema, type RecipesDatabaseSchema } from './recipes/infrastructure/persistence/recipeDatabaseModel';
import { recipesApi } from './recipes/presentation/api/server';

export const useCasesDatabaseSchema = { ...recipesDatabaseSchema };
export type UseCasesDatabaseSchema = RecipesDatabaseSchema;

export const useCasesApi = new Hono<{ Variables: ApplicationContext<UseCasesDatabaseSchema> }>()
  .route('/', recipesApi);