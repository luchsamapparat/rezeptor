import type { Recipe } from '../../../../common/persistence/generated/client';
export type RecipeEntity = Recipe;
export type InsertRecipeEntity = Omit<RecipeEntity, 'id'>;
export type UpdateRecipeEntity = Partial<InsertRecipeEntity>;
