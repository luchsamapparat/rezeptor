import { cookbooksTable } from './cookbooksTable';
import { ingredientsTable } from './ingredientsTable';
import { recipesTable } from './recipesTable';

export const recipesDatabaseSchema = { recipesTable, cookbooksTable, ingredientsTable };
export type RecipesDatabaseSchema = typeof recipesDatabaseSchema;