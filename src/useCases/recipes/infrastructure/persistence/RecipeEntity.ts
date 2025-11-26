import type { Recipe } from '@prisma/client';
export type RecipeEntity = Recipe;
export type InsertRecipeEntity = Omit<RecipeEntity, 'id'>;
export type UpdateRecipeEntity = Partial<InsertRecipeEntity>;
