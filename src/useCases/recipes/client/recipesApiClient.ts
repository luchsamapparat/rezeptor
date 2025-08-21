import { hc, type InferResponseType } from 'hono/client';
import type { recipesApi } from '../../recipes/server/api';

const fetch = import.meta.env.SSR ? await import('../../recipes/server/api').then(m => m.recipesApi.request) : undefined;

const recipesApiClient = hc<typeof recipesApi>(import.meta.env.SSR ? '/' : '/api', { fetch });

export type RecipeDto = InferResponseType<typeof recipesApiClient.recipes.$get>[0];

const recipesQueryKey = ['recipes'];

export const recipesQuery = ({ initialData }: { initialData?: RecipeDto[] } = {}) => ({
  initialData,
  queryKey: recipesQueryKey,
  queryFn: async () => {
    const response = await recipesApiClient.recipes.$get();

    if (!response.ok) {
      throw new Error(`Failed to fetch recipes: ${response.statusText}`);
    }

    return response.json();
  },
});