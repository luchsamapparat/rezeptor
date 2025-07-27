import { cookbooksApi } from 'useCases/cookbooks/server/api';
import { cookbooksSchema } from './cookbooks/server/persistence';
import { recipesApi } from './recipes/server/api';
import { recipesSchema } from './recipes/server/persistence';

export const api = { cookbooksApi, recipesApi };
export const databaseSchema = { ...cookbooksSchema, ...recipesSchema };
