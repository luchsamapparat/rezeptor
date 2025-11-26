import { Badge } from '@rezeptor/ui/components/ui/Badge';
import { Button } from '@rezeptor/ui/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@rezeptor/ui/components/ui/Card';
import { Input } from '@rezeptor/ui/components/ui/Input';
import { Label } from '@rezeptor/ui/components/ui/Label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getQueryClient } from '../../../../application/client/queryClient';
import { ErrorState, LoadingState, PageHeader } from '../../../../application/ui/components';
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
    const authorsArray = authors.split(',').map(author => ({ name: author.trim() })).filter(Boolean);

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
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Cookbook Details" />
        <LoadingState message="Loading cookbook..." />
      </div>
    );
  }

  if (error || !cookbook) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Cookbook Details" />
        <ErrorState message={error instanceof Error ? error.message : 'Cookbook not found'} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Cookbook Details"
        actions={[
          { label: 'Back to Cookbooks', to: '/cookbooks', variant: 'secondary' },
          {
            label: isEditing ? 'Cancel Edit' : 'Edit',
            onClick: () => setIsEditing(!isEditing),
            variant: isEditing ? 'outline' : 'default',
          },
        ]}
      />

      {isEditing
        ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Cookbook</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEditCookbook} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Title *
                    </Label>
                    <Input
                      type="text"
                      id="title"
                      name="title"
                      defaultValue={cookbook.title}
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
                      defaultValue={cookbook.authors.map(({ name }) => name).join(', ')}
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
                        defaultValue={cookbook.isbn10 || ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="isbn13">ISBN-13</Label>
                      <Input
                        type="text"
                        id="isbn13"
                        name="isbn13"
                        defaultValue={cookbook.isbn13 || ''}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={editCookbookMutation.isPending}
                  >
                    {editCookbookMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>

                {editCookbookMutation.error && (
                  <div className="mt-4">
                    <ErrorState message={editCookbookMutation.error.message} />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        : (
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{cookbook.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Authors</h3>
                  <p className="text-muted-foreground">{cookbook.authors.join(', ')}</p>
                </div>

                {(cookbook.isbn10 || cookbook.isbn13) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">ISBN Information</h3>
                    <div className="flex gap-3 flex-wrap">
                      {cookbook.isbn10 && (
                        <Badge variant="secondary" className="px-4 py-2 text-sm font-mono">
                          ISBN-10:
                          {' '}
                          {cookbook.isbn10}
                        </Badge>
                      )}
                      {cookbook.isbn13 && (
                        <Badge variant="outline" className="px-4 py-2 text-sm font-mono">
                          ISBN-13:
                          {' '}
                          {cookbook.isbn13}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">Cookbook ID</h3>
                  <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                    {cookbook.id}
                  </code>
                </div>
              </CardContent>
            </Card>
          )}
    </div>
  );
}
