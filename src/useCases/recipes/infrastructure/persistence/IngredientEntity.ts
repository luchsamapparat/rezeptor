import type { Ingredient } from '../../../../common/persistence/generated/client';
export type IngredientEntity = Ingredient;
export type InsertIngredientEntity = Omit<IngredientEntity, 'id'>;
export type UpdateIngredientEntity = Partial<InsertIngredientEntity>;
