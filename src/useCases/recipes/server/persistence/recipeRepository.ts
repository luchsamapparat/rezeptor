import type { Database } from '../../../../common/persistence/database';
import { DatabaseRepository } from '../../../../common/persistence/DatabaseRepository';
import { recipesTable } from './recipesTable';

export class RecipeRepository extends DatabaseRepository<typeof recipesTable> {
  constructor(
    database: Database<{ recipesTable: typeof recipesTable }>,
  ) {
    super(database, recipesTable);
  }
}
