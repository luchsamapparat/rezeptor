import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';
import type z from 'zod';
import { recipesTable } from './recipesTable';

export type RecipeEntity = typeof recipesTable.$inferSelect;

export const insertRecipeEntitySchema = createInsertSchema(recipesTable).omit({ id: true });
export type InsertRecipeEntity = z.infer<typeof insertRecipeEntitySchema>;

export const updateRecipeEntitySchema = createUpdateSchema(recipesTable).omit({ id: true });
export type UpdateRecipeEntity = z.infer<typeof updateRecipeEntitySchema>;