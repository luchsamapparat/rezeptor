import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { getQueryClient } from '../../../../application/client/queryClient';
import { cookbookQuery, editCookbook } from '../api/client';
import type { Route } from './+types/CookbookDetailsController';

export const loader = async ({ context, params }: Route.LoaderArgs) => {
  const cookbook = await getQueryClient(context).ensureQueryData(cookbookQuery(params.cookbookId));
  return { cookbook };
};

export default function CookbookDetailsController({ loaderData, params }: Route.ComponentProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: cookbook,
    isLoading,
    error,
  } = useQuery(cookbookQuery(params.cookbookId, { initialData: loaderData.cookbook }));

  const editCookbookMutation = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Parameters<typeof editCookbook>[1] }) =>
      editCookbook(id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
      queryClient.invalidateQueries({ queryKey: ['cookbooks', params.cookbookId] });
      setIsEditing(false);
    },
  });

  const handleEditCookbook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const authors = formData.get('authors') as string;
    const authorsArray = authors.split(',').map(author => author.trim()).filter(Boolean);

    await editCookbookMutation.mutateAsync({
      id: params.cookbookId,
      changes: {
        title: formData.get('title') as string,
        authors: authorsArray,
        isbn10: (formData.get('isbn10') as string) || null,
        isbn13: (formData.get('isbn13') as string) || null,
      },
    });
  };

  if (isLoading) {
    return (
      <div>
        <h1>Cookbook Details</h1>
        <p>Loading cookbook...</p>
      </div>
    );
  }

  if (error || !cookbook) {
    return (
      <div>
        <h1>Cookbook Details</h1>
        <p style={{ color: 'red' }}>
          Error:
          {' '}
          {error instanceof Error ? error.message : 'Cookbook not found'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Cookbook Details</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            to="/cookbooks"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            Back to Cookbooks
          </Link>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isEditing ? 'Cancel Edit' : 'Edit'}
          </button>
        </div>
      </div>

      {isEditing
        ? (
            <div
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
              }}
            >
              <h2>Edit Cookbook</h2>
              <form onSubmit={handleEditCookbook}>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Title: *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    defaultValue={cookbook.title}
                    required
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      width: '100%',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="authors" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Authors (comma-separated): *
                  </label>
                  <input
                    type="text"
                    id="authors"
                    name="authors"
                    defaultValue={cookbook.authors.join(', ')}
                    required
                    placeholder="e.g., John Doe, Jane Smith"
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      width: '100%',
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label htmlFor="isbn10" style={{ display: 'block', marginBottom: '0.5rem' }}>
                      ISBN-10:
                    </label>
                    <input
                      type="text"
                      id="isbn10"
                      name="isbn10"
                      defaultValue={cookbook.isbn10 || ''}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        width: '100%',
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="isbn13" style={{ display: 'block', marginBottom: '0.5rem' }}>
                      ISBN-13:
                    </label>
                    <input
                      type="text"
                      id="isbn13"
                      name="isbn13"
                      defaultValue={cookbook.isbn13 || ''}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        width: '100%',
                      }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={editCookbookMutation.isPending}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: editCookbookMutation.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {editCookbookMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </form>

              {editCookbookMutation.error && (
                <p style={{ color: 'red', marginTop: '1rem' }}>
                  Error:
                  {' '}
                  {editCookbookMutation.error.message}
                </p>
              )}
            </div>
          )
        : (
            <div
              style={{
                padding: '1.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
              }}
            >
              <h2>{cookbook.title}</h2>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Authors</h3>
                <p style={{ margin: '0', color: '#666' }}>{cookbook.authors.join(', ')}</p>
              </div>

              {(cookbook.isbn10 || cookbook.isbn13) && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>ISBN Information</h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {cookbook.isbn10 && (
                      <span
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#e3f2fd',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                        }}
                      >
                        <strong>ISBN-10:</strong>
                        {' '}
                        {cookbook.isbn10}
                      </span>
                    )}
                    {cookbook.isbn13 && (
                      <span
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#e8f5e8',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                        }}
                      >
                        <strong>ISBN-13:</strong>
                        {' '}
                        {cookbook.isbn13}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Cookbook ID</h3>
                <code style={{ fontSize: '0.875rem', color: '#666' }}>{cookbook.id}</code>
              </div>
            </div>
          )}
    </div>
  );
}
