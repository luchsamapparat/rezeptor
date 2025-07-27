import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { foreignKey, key, primaryKey } from '~/common/persistence/databaseSchema';
import { cookbooksSchema } from '~/useCases/cookbooks/server/persistence';

const recipes = sqliteTable('recipes', {
  id: primaryKey(),
  title: text().notNull(),
  content: text().notNull(),
  photoFileId: key(),
  recipeFileId: key(),
  cookbookId: foreignKey(() => cookbooksSchema.cookbooks.id, { onDelete: 'no action' }),
  pageNumber: integer(),
});

export type Recipe = typeof recipes.$inferSelect;

export const recipesSchema = { recipes };
