import { useQuery } from '@tanstack/react-query';
import { getQueryClient } from '../../../../application/client/queryClient';
import { EmptyState, ErrorState, LoadingState, PageHeader, RecipeCard } from '../../../../application/ui/components';
import { recipesQuery } from '../api/client';
import type { Route } from './+types/RecipeBrowserController';

export const loader = async ({ context }: Route.LoaderArgs) => ({ recipes: await getQueryClient(context).ensureQueryData(recipesQuery()) });

export default function RecipeBrowserController({ loaderData }: Route.ComponentProps) {
  const {
    data: recipes = [],
    isLoading,
    error,
  } = useQuery(recipesQuery({ initialData: loaderData.recipes }));

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Recipe Browser" />
        <LoadingState message="Loading recipes..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Recipe Browser" />
        <ErrorState message={error instanceof Error ? error.message : 'Unknown error occurred'} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Recipe Browser"
        actions={[
          { label: 'Add Recipe', to: '/recipes/new', variant: 'default' },
          { label: 'Upload from Photo', to: '/recipes/from-photo', variant: 'secondary' },
          { label: 'Manage Cookbooks', to: '/cookbooks', variant: 'outline' },
        ]}
      />

      {recipes.length === 0
        ? (
            <EmptyState message="No recipes found. Add some recipes to get started!" />
          )
        : (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                All Recipes (
                {recipes.length}
                )
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    title={recipe.title}
                    instructions={recipe.instructions}
                    ingredients={recipe.ingredients}
                    photoUrl={recipe.photoFileId ? `/api/recipes/${recipe.id}/photo` : undefined}
                    pageNumber={recipe.pageNumber ?? undefined}
                    cookbookTitle={recipe.cookbook?.title}
                  />
                ))}
              </div>
            </div>
          )}
    </div>
  );
}
