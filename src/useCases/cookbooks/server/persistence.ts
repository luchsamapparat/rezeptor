import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { primaryKey } from '~/common/persistence/databaseSchema';

const cookbooks = sqliteTable('cookbooks', {
  id: primaryKey(),
  title: text().notNull(),
  authors: text({ mode: 'json' }).notNull().$type<string[]>(),
  isbn10: text(),
  isbn13: text(),
});

export type Cookbook = typeof cookbooks.$inferSelect;

export const cookbooksSchema = { cookbooks };
