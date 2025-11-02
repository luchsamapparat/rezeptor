import { Button } from '@rezeptor/ui/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@rezeptor/ui/components/ui/Card';
import { Input } from '@rezeptor/ui/components/ui/Input';
import { Label } from '@rezeptor/ui/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@rezeptor/ui/components/ui/Select';
import { Textarea } from '@rezeptor/ui/components/ui/Textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ErrorState, PageHeader } from '../../../../application/ui/components';
import { addRecipe, cookbooksQuery } from '../api/client';

export default function RecipeFormController() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cookbooks = [] } = useQuery(cookbooksQuery());

  const addRecipeMutation = useMutation({
    mutationFn: addRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate('/');
    },
  });

  const handleAddRecipe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const cookbookId = formData.get('cookbookId') as string;
    const pageNumber = formData.get('pageNumber') as string;

    await addRecipeMutation.mutateAsync({
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      cookbookId: cookbookId === '__none__' ? null : cookbookId || null,
      pageNumber: pageNumber ? Number(pageNumber) : null,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Add New Recipe"
        actions={[
          { label: 'Back to Recipes', to: '/', variant: 'secondary' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recipe Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddRecipe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title *
              </Label>
              <Input
                type="text"
                id="title"
                name="title"
                required
                placeholder="e.g., Chocolate Chip Cookies"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                Content *
              </Label>
              <Textarea
                id="content"
                name="content"
                required
                rows={10}
                placeholder="Enter recipe instructions, ingredients, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cookbookId">Cookbook (Optional)</Label>
                <Select name="cookbookId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cookbook" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {cookbooks.map(cookbook => (
                      <SelectItem key={cookbook.id} value={cookbook.id}>
                        {cookbook.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageNumber">Page Number (Optional)</Label>
                <Input
                  type="number"
                  id="pageNumber"
                  name="pageNumber"
                  min={1}
                  placeholder="e.g., 42"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={addRecipeMutation.isPending}
            >
              {addRecipeMutation.isPending ? 'Adding...' : 'Add Recipe'}
            </Button>
          </form>

          {addRecipeMutation.error && (
            <div className="mt-4">
              <ErrorState message={addRecipeMutation.error.message} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
