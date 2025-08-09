import { useQuery } from '@tanstack/react-query';
import { getQueryClient } from '../../../../application/client/queryClient';
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
      <div>
        <h1>Recipe Browser</h1>
        <p>Loading recipes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Recipe Browser</h1>
        <p style={{ color: 'red' }}>
          Error:
          {' '}
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Recipe Browser</h1>

      {recipes.length === 0
        ? (
            <p>No recipes found. Add some recipes to get started!</p>
          )
        : (
            <div>
              <h2>
                All Recipes (
                {recipes.length}
                )
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {recipes.map(recipe => (
                  <div key={recipe.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem' }}>
                    {recipe.photoFileId && (
                      <div style={{ marginBottom: '1rem' }}>
                        <img
                          src={`/api/recipes/${recipe.id}/photo`}
                          alt={`Photo of ${recipe.title}`}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #eee',
                          }}
                          onError={(e) => {
                            // Hide the image if it fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <h3>{recipe.title}</h3>
                    <div style={{ marginBottom: '1rem' }}>
                      {recipe.content.length > 200
                        ? `${recipe.content.substring(0, 200)}...`
                        : recipe.content}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                      {recipe.pageNumber && (
                        <span style={{ padding: '0.25rem 0.5rem', background: '#f5f5f5', borderRadius: '4px' }}>
                          Page
                          {' '}
                          {recipe.pageNumber}
                        </span>
                      )}
                      {recipe.cookbook && (
                        <span style={{ padding: '0.25rem 0.5rem', background: '#f5f5f5', borderRadius: '4px' }}>
                          From:
                          {' '}
                          {recipe.cookbook.title}
                        </span>
                      )}
                      {recipe.photoFileId && (
                        <span style={{ padding: '0.25rem 0.5rem', background: '#e8f5e8', borderRadius: '4px' }}>
                          📷
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
    </div>
  );
}
