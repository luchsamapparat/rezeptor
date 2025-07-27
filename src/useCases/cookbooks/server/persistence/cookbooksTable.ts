import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';
import { primaryKey } from '../../../../common/persistence/databaseSchema';

export const cookbooksTable = sqliteTable('cookbooks', {
  id: primaryKey(),
  title: text().notNull(),
  authors: text({ mode: 'json' }).notNull().$type<string[]>(),
  isbn10: text(),
  isbn13: text(),
});

export type Cookbook = typeof cookbooksTable.$inferSelect;

export const insertCookbookSchema = createInsertSchema(cookbooksTable).omit({ id: true });
export const updateCookbookSchema = createUpdateSchema(cookbooksTable).omit({ id: true });