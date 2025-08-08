import type { InferResponseType } from 'hono/client';
import { useCasesApiClient } from '../../apiClient';

export type RecipeDto = InferResponseType<typeof useCasesApiClient.recipes.$get>;

const recipesQueryKey = ['recipes'];

export const recipesQuery = () => ({
  queryKey: recipesQueryKey,
  queryFn: async () => {
    const response = await useCasesApiClient.recipes.$get();

    if (!response.ok) {
      throw new Error(`Failed to fetch recipes: ${response.statusText}`);
    }

    return response.json();
  },
});