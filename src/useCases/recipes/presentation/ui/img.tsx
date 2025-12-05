import { useQuery } from '@tanstack/react-query';
import { isNull } from 'lodash-es';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { getQueryClient } from '../../../../application/client/queryClient';
import { recipesQuery } from '../api/client';
import type { Route } from './+types/RecipeBrowserController';
import './stylesheet.css';

export const loader = async ({ context }: Route.LoaderArgs) => ({ recipes: await getQueryClient(context).ensureQueryData(recipesQuery()) });

export default function RecipeBrowserController({ loaderData }: Route.ComponentProps) {
  const {
    data: recipes = [],
    isLoading,
    error,
  } = useQuery(recipesQuery({ initialData: loaderData.recipes }));

  if (isLoading) {
    return (
      <h1>Loading...</h1>
    );
  }

  if (error) {
    return (
      <>
        <h1>Error</h1>
        <pre>{error instanceof Error ? error.message : error}</pre>
      </>
    );
  }

  const recipesWithPhotos = recipes.filter(recipe => !isNull(recipe.photoFileId));

  return (
    <img src={`api/recipes/${recipesWithPhotos[0].id}/photo`} />
  );
}
