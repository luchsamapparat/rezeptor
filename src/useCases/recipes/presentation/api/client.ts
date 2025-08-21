import { hc, type InferRequestType, type InferResponseType } from 'hono/client';
import type { recipesApi } from './server';

const fetch = import.meta.env.SSR ? await import('./server').then(m => m.recipesApi.request) : undefined;

const recipesApiClient = hc<typeof recipesApi>(import.meta.env.SSR ? '/' : '/api', { fetch });

export type RecipeDto = InferResponseType<typeof recipesApiClient.recipes.$get>[0];
export type AddRecipeDto = InferRequestType<typeof recipesApiClient.recipes.$post>['json'];
export type AddFromPhotoRecipeDto = InferRequestType<typeof recipesApiClient.recipes['from-photo']['$post']>['form'];
export type EditRecipeDto = InferRequestType<typeof recipesApiClient.recipes[':recipeId']['$patch']>['json'];

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

export type CookbookDto = InferResponseType<typeof recipesApiClient.cookbooks.$get>[0];
export type AddCookbookDto = InferRequestType<typeof recipesApiClient.cookbooks.$post>['json'];
export type EditCookbookDto = InferRequestType<typeof recipesApiClient.cookbooks[':cookbookId']['$patch']>['json'];