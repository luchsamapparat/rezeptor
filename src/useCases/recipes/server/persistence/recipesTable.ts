import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { foreignKey, key, primaryKey } from '../../../../common/persistence/databaseSchema';
import { cookbooksTable } from '../../../cookbooks/server/persistence/cookbooksTable';

export const recipesTable = sqliteTable('recipes', {
  id: primaryKey(),
  title: text().notNull(),
  content: text().notNull(),
  photoFileId: key(),
  recipeFileId: key(),
  cookbookId: foreignKey(() => cookbooksTable.id, { onDelete: 'no action' }),
  pageNumber: integer(),
});
