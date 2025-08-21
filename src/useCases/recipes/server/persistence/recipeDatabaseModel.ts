import { cookbooksTable } from './cookbooksTable';
import { recipesTable } from './recipesTable';

export const recipesDatabaseSchema = { recipesTable, cookbooksTable };
export type RecipesDatabaseSchema = typeof recipesDatabaseSchema;