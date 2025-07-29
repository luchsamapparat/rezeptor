import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { primaryKey } from '../../../../common/persistence/databaseSchema';

export const cookbooksTable = sqliteTable('cookbooks', {
  id: primaryKey(),
  title: text().notNull(),
  authors: text({ mode: 'json' }).notNull().$type<string[]>(),
  isbn10: text(),
  isbn13: text(),
});
