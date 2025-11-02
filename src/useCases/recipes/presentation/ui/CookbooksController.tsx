import { Alert, AlertDescription, AlertTitle } from '@rezeptor/ui/components/ui/Alert';
import { Button } from '@rezeptor/ui/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@rezeptor/ui/components/ui/Card';
import { Input } from '@rezeptor/ui/components/ui/Input';
import { Label } from '@rezeptor/ui/components/ui/Label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { getQueryClient } from '../../../../application/client/queryClient';
import { CookbookCard, EmptyState, ErrorState, LoadingState, PageHeader } from '../../../../application/ui/components';
import { addCookbook, cookbooksQuery, identifyCookbook, removeCookbook, type CookbookIdentificationDto } from '../api/client';
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

  const handleRemoveCookbook = async (id: string) => {
    const cookbook = cookbooks.find(c => c.id === id);
    if (cookbook && confirm(`Are you sure you want to remove "${cookbook.title}"?`)) {
      await removeCookbookMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Cookbook Management" />
        <LoadingState message="Loading cookbooks..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Cookbook Management" />
        <ErrorState message={error instanceof Error ? error.message : 'Unknown error occurred'} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Cookbook Management"
        actions={[
          { label: '← Back to Recipes', to: '/', variant: 'secondary' },
          {
            label: showAddForm ? 'Cancel' : 'Add Cookbook',
            onClick: () => {
              setShowAddForm(!showAddForm);
              setIdentificationResult(null);
            },
            variant: showAddForm ? 'outline' : 'default',
          },
        ]}
      />

      {/* Add Cookbook Form */}
      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Cookbook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Identification Helper */}
            {!identificationResult && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Auto-fill from back cover image</AlertTitle>
                <AlertDescription>
                  <p className="mb-4">
                    Upload a photo of the cookbook&apos;s back cover to automatically fill out the form fields below.
                  </p>
                  <form onSubmit={handleIdentifyCookbook} className="space-y-4">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input
                          type="file"
                          name="backCoverFile"
                          accept="image/*"
                          className="cursor-pointer"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={identifyCookbookMutation.isPending}
                      >
                        {identifyCookbookMutation.isPending ? 'Identifying...' : 'Auto-fill'}
                      </Button>
                    </div>
                    {identifyCookbookMutation.error && (
                      <ErrorState message={identifyCookbookMutation.error.message} />
                    )}
                  </form>
                </AlertDescription>
              </Alert>
            )}

            {/* Success message for identification */}
            {identificationResult && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Cookbook identified successfully!</AlertTitle>
                <AlertDescription>
                  <p className="mb-2 text-green-600">
                    The form below has been filled with the identified information. You can edit the fields before saving.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIdentificationResult(null)}
                    variant="outline"
                    size="sm"
                    className="border-green-600 text-green-600 hover:bg-green-100"
                  >
                    Clear and try again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Manual Form */}
            <div className={identificationResult ? 'border-t pt-6' : ''}>
              <form onSubmit={handleAddCookbook} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title *
                  </Label>
                  <Input
                    type="text"
                    id="title"
                    name="title"
                    defaultValue={identificationResult?.title || ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authors">
                    Authors (comma-separated) *
                  </Label>
                  <Input
                    type="text"
                    id="authors"
                    name="authors"
                    defaultValue={identificationResult?.authors?.join(', ') || ''}
                    required
                    placeholder="e.g., John Doe, Jane Smith"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="isbn10">ISBN-10</Label>
                    <Input
                      type="text"
                      id="isbn10"
                      name="isbn10"
                      defaultValue={identificationResult?.isbn10 || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isbn13">ISBN-13</Label>
                    <Input
                      type="text"
                      id="isbn13"
                      name="isbn13"
                      defaultValue={identificationResult?.isbn13 || ''}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={addCookbookMutation.isPending}
                >
                  {addCookbookMutation.isPending ? 'Adding...' : 'Add Cookbook'}
                </Button>
              </form>

              {addCookbookMutation.error && (
                <ErrorState message={addCookbookMutation.error.message} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cookbooks List */}
      {cookbooks.length === 0
        ? (
            <EmptyState message="No cookbooks found. Add some cookbooks to get started!" />
          )
        : (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                All Cookbooks (
                {cookbooks.length}
                )
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cookbooks.map(cookbook => (
                  <CookbookCard
                    key={cookbook.id}
                    id={cookbook.id}
                    title={cookbook.title}
                    authors={cookbook.authors}
                    isbn10={cookbook.isbn10}
                    isbn13={cookbook.isbn13}
                    onRemove={handleRemoveCookbook}
                    isRemoving={removeCookbookMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
    </div>
  );
}
