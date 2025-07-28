import { cookbooksApi } from './cookbooks/server/api';
import { cookbooksTable } from './cookbooks/server/persistence/cookbooksTable';
import { recipesApi } from './recipes/server/api';
import { recipesTable } from './recipes/server/persistence/recipesTable';

export const useCasesApi = { cookbooksApi, recipesApi };
export const useCasesDatabaseSchema = { cookbooksTable, recipesTable };