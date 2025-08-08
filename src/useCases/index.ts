import { Hono } from 'hono';
import type { ApplicationContext } from '../application/server/di';
import { cookbookManagementApi } from './cookbookManagement/server/api';
import { cookbookManagementDatabaseSchema, type CookbookManagementDatabaseSchema } from './cookbookManagement/server/persistence/cookbookDatabaseModel';
import { recipeManagementApi } from './recipeManagement/server/api';
import { recipeManagementDatabaseSchema, type RecipeManagementDatabaseSchema } from './recipeManagement/server/persistence/recipeManagementDatabaseModel';

export const useCasesDatabaseSchema = { ...cookbookManagementDatabaseSchema, ...recipeManagementDatabaseSchema };
export type UseCasesDatabaseSchema = CookbookManagementDatabaseSchema & RecipeManagementDatabaseSchema;

export const useCasesApi = new Hono<{ Variables: ApplicationContext<UseCasesDatabaseSchema> }>()
  .route('/', cookbookManagementApi)
  .route('/', recipeManagementApi);