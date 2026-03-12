import { useQuery } from '@tanstack/react-query';
import { isNull } from 'lodash-es';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
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

    <>

      {
        recipesWithPhotos.length === 0
          ? (
              <p>No recipes found. Add some recipes to get started!</p>
            )
          : (
              <Swiper
                slidesPerView={1}
                loop={true}
                modules={[Pagination, Navigation]}
              >
                {recipesWithPhotos.map(recipe => (
                  <SwiperSlide
                    key={recipe.id}
                    style={{
                      backgroundImage: recipe.photoFileId ? `url('/api/recipes/${recipe.id}/photo')` : undefined,
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'cover',
                    }}
                  >
                  </SwiperSlide>
                ))}
              </Swiper>
            )
      }
    </>
  );
}
