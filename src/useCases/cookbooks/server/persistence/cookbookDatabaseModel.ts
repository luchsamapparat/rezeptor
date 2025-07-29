import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';
import type z from 'zod';
import { cookbooksTable } from './cookbooksTable';

export type CookbookEntity = typeof cookbooksTable.$inferSelect;

export const insertCookbookEntitySchema = createInsertSchema(cookbooksTable).omit({ id: true });
export type InsertCookbookEntity = z.infer<typeof insertCookbookEntitySchema>;

export const updateCookbookEntitySchema = createUpdateSchema(cookbooksTable).omit({ id: true });
export type UpdateCookbookEntity = z.infer<typeof updateCookbookEntitySchema>;