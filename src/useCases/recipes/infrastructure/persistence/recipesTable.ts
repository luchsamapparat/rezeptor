import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { foreignKey, key, primaryKey } from '../../../../common/persistence/databaseSchema';
import { cookbooksTable } from './cookbooksTable';

export const recipesTable = sqliteTable('recipes', {
  id: primaryKey(),
  title: text().notNull(),
  content: text().notNull(),
  photoFileId: key(),
  recipeFileId: key(),
  cookbookId: foreignKey(() => cookbooksTable.id, { onDelete: 'no action' }),
  pageNumber: integer(),
});

export type RecipeEntity = typeof recipesTable.$inferSelect;
export type InsertRecipeEntity = Omit<typeof recipesTable.$inferInsert, 'id'>;
export type UpdateRecipeEntity = Partial<InsertRecipeEntity>;