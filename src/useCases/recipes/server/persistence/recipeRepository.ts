import type { Database } from '../../../../common/persistence/database';
import { Repository } from '../../../../common/persistence/repository';
import { recipesTable } from './recipesTable';

export class RecipeRepository extends Repository<typeof recipesTable> {
  constructor(
    database: Database<{ recipesTable: typeof recipesTable }>,
  ) {
    super(database, recipesTable);
  }
}
