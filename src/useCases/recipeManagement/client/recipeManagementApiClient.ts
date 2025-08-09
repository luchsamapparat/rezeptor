import { hc, type InferResponseType } from 'hono/client';
import type { recipeManagementApi } from '../server/api';

const fetch = import.meta.env.SSR ? await import('../../recipeManagement/server/api').then(m => m.recipeManagementApi.request) : undefined;

const recipeManagementApiClient = hc<typeof recipeManagementApi>(import.meta.env.SSR ? '/' : '/api', { fetch });

export type RecipeDto = InferResponseType<typeof recipeManagementApiClient.recipes.$get>[0];

const recipesQueryKey = ['recipes'];

export const recipesQuery = ({ initialData }: { initialData?: RecipeDto[] } = {}) => ({
  initialData,
  queryKey: recipesQueryKey,
  queryFn: async () => {
    const response = await recipeManagementApiClient.recipes.$get();

    if (!response.ok) {
      throw new Error(`Failed to fetch recipes: ${response.statusText}`);
    }

    return response.json();
  },
});