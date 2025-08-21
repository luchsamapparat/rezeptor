import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { primaryKey } from '../../../../common/persistence/databaseSchema';

export const cookbooksTable = sqliteTable('cookbooks', {
  id: primaryKey(),
  title: text().notNull(),
  authors: text({ mode: 'json' }).notNull().$type<string[]>(),
  isbn10: text(),
  isbn13: text(),
});

export type CookbookEntity = typeof cookbooksTable.$inferSelect;
export type InsertCookbookEntity = Omit<typeof cookbooksTable.$inferInsert, 'id'>;
export type UpdateCookbookEntity = Partial<InsertCookbookEntity>;