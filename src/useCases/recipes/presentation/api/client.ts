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
export type CookbookIdentificationDto = InferResponseType<typeof recipesApiClient.cookbooks.identification.$post>;
export type AddCookbookDto = InferRequestType<typeof recipesApiClient.cookbooks.$post>['json'];
export type EditCookbookDto = InferRequestType<typeof recipesApiClient.cookbooks[':cookbookId']['$patch']>['json'];

const cookbooksQueryKey = ['cookbooks'];
const cookbookQueryKey = (id: string) => ['cookbooks', id];

export const cookbooksQuery = ({ initialData }: { initialData?: CookbookDto[] } = {}) => ({
  initialData,
  queryKey: cookbooksQueryKey,
  queryFn: async () => {
    const response = await recipesApiClient.cookbooks.$get();

    if (!response.ok) {
      throw new Error(`Failed to fetch cookbooks: ${response.statusText}`);
    }

    return response.json();
  },
});

export const cookbookQuery = (id: string, { initialData }: { initialData?: CookbookDto } = {}) => ({
  initialData,
  queryKey: cookbookQueryKey(id),
  queryFn: async () => {
    const response = await recipesApiClient.cookbooks[':cookbookId'].$get({
      param: { cookbookId: id },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cookbook: ${response.statusText}`);
    }

    return response.json();
  },
});

export const addCookbook = async (cookbook: {
  title: string;
  authors: string[];
  isbn10: string | null;
  isbn13: string | null;
}) => {
  const response = await recipesApiClient.cookbooks.$post({
    json: cookbook,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(errorData.error || `Failed to add cookbook: ${response.statusText}`);
  }

  return response.json();
};

export const editCookbook = async (id: string, changes: {
  title?: string;
  authors?: string[];
  isbn10?: string | null;
  isbn13?: string | null;
}) => {
  const response = await recipesApiClient.cookbooks[':cookbookId'].$patch({
    param: { cookbookId: id },
    json: changes,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(errorData.error || `Failed to edit cookbook: ${response.statusText}`);
  }

  return response.json();
};

export const removeCookbook = async (id: string) => {
  const response = await recipesApiClient.cookbooks[':cookbookId'].$delete({
    param: { cookbookId: id },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(errorData.error || `Failed to remove cookbook: ${response.statusText}`);
  }
};

export const identifyCookbook = async (backCoverFile: File) => {
  // Create FormData manually to ensure proper file handling
  const formData = new FormData();
  formData.append('backCoverFile', backCoverFile);

  // hc does not support uploading files
  // see https://github.com/honojs/website/pull/422
  const response = await window.fetch(
    '/api/cookbooks/identification',
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: string };
    console.log(errorData);
    throw new Error(errorData.error || `Failed to identify cookbook: ${response.statusText}`);
  }

  return response.json();
};
