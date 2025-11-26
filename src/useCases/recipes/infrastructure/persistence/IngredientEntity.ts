import type { Ingredient } from '@prisma/client';
export type IngredientEntity = Ingredient;
export type InsertIngredientEntity = Omit<IngredientEntity, 'id'>;
export type UpdateIngredientEntity = Partial<InsertIngredientEntity>;
