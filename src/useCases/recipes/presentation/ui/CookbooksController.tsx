import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { getQueryClient } from '../../../../application/client/queryClient';
import { addCookbook, cookbooksQuery, identifyCookbook, removeCookbook, type CookbookDto, type CookbookIdentificationDto } from '../api/client';
import type { Route } from './+types/CookbooksController';

export const loader = async ({ context }: Route.LoaderArgs) => ({
  cookbooks: await getQueryClient(context).ensureQueryData(cookbooksQuery()),
});

export default function CookbooksController({ loaderData }: Route.ComponentProps) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<CookbookIdentificationDto | null>(null);

  const {
    data: cookbooks = [],
    isLoading,
    error,
  } = useQuery(cookbooksQuery({ initialData: loaderData.cookbooks }));

  const addCookbookMutation = useMutation({
    mutationFn: addCookbook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
      setShowAddForm(false);
      setIdentificationResult(null);
    },
  });

  const removeCookbookMutation = useMutation({
    mutationFn: removeCookbook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
    },
  });

  const identifyCookbookMutation = useMutation({
    mutationFn: identifyCookbook,
    onSuccess: (result) => {
      setIdentificationResult(result);
    },
  });

  const handleAddCookbook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const authors = formData.get('authors') as string;
    const authorsArray = authors.split(',').map(author => author.trim()).filter(Boolean);

    await addCookbookMutation.mutateAsync({
      title: formData.get('title') as string,
      authors: authorsArray,
      isbn10: (formData.get('isbn10') as string) || null,
      isbn13: (formData.get('isbn13') as string) || null,
    });
  };

  const handleIdentifyCookbook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const backCoverFile = formData.get('backCoverFile') as File;

    if (backCoverFile && backCoverFile.size > 0) {
      await identifyCookbookMutation.mutateAsync(backCoverFile);
    }
  };

  const handleRemoveCookbook = async (cookbook: CookbookDto) => {
    if (confirm(`Are you sure you want to remove "${cookbook.title}"?`)) {
      await removeCookbookMutation.mutateAsync(cookbook.id);
    }
  };

  if (isLoading) {
    return (
      <div>
        <h1>Cookbook Management</h1>
        <p>Loading cookbooks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Cookbook Management</h1>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link
            to="/"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              marginRight: '1rem',
            }}
          >
            ← Back to Recipes
          </Link>
          <h1 style={{ display: 'inline', margin: 0 }}>Cookbook Management</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setIdentificationResult(null);
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {showAddForm ? 'Cancel' : 'Add Cookbook'}
          </button>
        </div>
      </div>

      {/* Add Cookbook Form */}
      {showAddForm && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa',
          }}
        >
          <h2>Add New Cookbook</h2>

          {/* Identification Helper */}
          {!identificationResult && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                border: '1px solid #007bff',
                borderRadius: '4px',
                backgroundColor: '#e7f3ff',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#0056b3' }}>
                💡 Auto-fill from back cover image
              </h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#0056b3' }}>
                Upload a photo of the cookbook&apos;s back cover to automatically fill out the form fields below.
              </p>
              <form onSubmit={handleIdentifyCookbook}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      name="backCoverFile"
                      accept="image/*"
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        width: '100%',
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={identifyCookbookMutation.isPending}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: identifyCookbookMutation.isPending ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {identifyCookbookMutation.isPending ? 'Identifying...' : 'Auto-fill'}
                  </button>
                </div>
                {identifyCookbookMutation.error && (
                  <p style={{ color: '#dc3545', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    {identifyCookbookMutation.error.message}
                  </p>
                )}
              </form>
            </div>
          )}

          {/* Success message for identification */}
          {identificationResult && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                border: '1px solid #28a745',
                borderRadius: '4px',
                backgroundColor: '#d4edda',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>
                ✅ Cookbook identified successfully!
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#155724' }}>
                The form below has been filled with the identified information. You can edit the fields before saving.
              </p>
              <button
                type="button"
                onClick={() => setIdentificationResult(null)}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'transparent',
                  color: '#155724',
                  border: '1px solid #155724',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                Clear and try again
              </button>
            </div>
          )}

          {/* Manual Form */}
          <div style={{ borderTop: !identificationResult ? 'none' : '1px solid #ddd', paddingTop: !identificationResult ? '0' : '1rem' }}>
            <form onSubmit={handleAddCookbook}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Title: *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  defaultValue={identificationResult?.title || ''}
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
                  defaultValue={identificationResult?.authors?.join(', ') || ''}
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
                    defaultValue={identificationResult?.isbn10 || ''}
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
                    defaultValue={identificationResult?.isbn13 || ''}
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
                disabled={addCookbookMutation.isPending}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: addCookbookMutation.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {addCookbookMutation.isPending ? 'Adding...' : 'Add Cookbook'}
              </button>
            </form>

            {addCookbookMutation.error && (
              <p style={{ color: 'red', marginTop: '1rem' }}>
                Error:
                {' '}
                {addCookbookMutation.error.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Cookbooks List */}
      {cookbooks.length === 0
        ? (
            <p>No cookbooks found. Add some cookbooks to get started!</p>
          )
        : (
            <div>
              <h2>
                All Cookbooks (
                {cookbooks.length}
                )
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {cookbooks.map(cookbook => (
                  <div
                    key={cookbook.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      backgroundColor: 'white',
                    }}
                  >
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{cookbook.title}</h3>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                        by
                        {' '}
                        {cookbook.authors.join(', ')}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                        {cookbook.isbn10 && (
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#e3f2fd',
                              borderRadius: '4px',
                            }}
                          >
                            ISBN-10:
                            {' '}
                            {cookbook.isbn10}
                          </span>
                        )}
                        {cookbook.isbn13 && (
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#e8f5e8',
                              borderRadius: '4px',
                            }}
                          >
                            ISBN-13:
                            {' '}
                            {cookbook.isbn13}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        to={cookbook.id}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                        }}
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleRemoveCookbook(cookbook)}
                        disabled={removeCookbookMutation.isPending}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: removeCookbookMutation.isPending ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        {removeCookbookMutation.isPending ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
    </div>
  );
}
