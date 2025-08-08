import { eq, getTableColumns } from 'drizzle-orm';
import type { Database } from '../../../../common/persistence/database';
import { DatabaseRepository } from '../../../../common/persistence/DatabaseRepository';
import { cookbooksTable } from '../../../cookbookManagement/server/persistence/cookbooksTable';
import { recipesTable } from './recipesTable';

export class RecipeRepository extends DatabaseRepository<typeof recipesTable> {
  constructor(
    database: Database<{ recipesTable: typeof recipesTable; cookbooksTable: typeof cookbooksTable }>,
  ) {
    super(database, recipesTable);
  }

  async getAllWithCookbooks() {
    return this.database
      .select({
        ...getTableColumns(recipesTable),
        cookbook: getTableColumns(cookbooksTable),
      })
      .from(recipesTable)
      .leftJoin(cookbooksTable, eq(recipesTable.cookbookId, cookbooksTable.id));
  }
}
