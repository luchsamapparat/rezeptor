import { Button } from './components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Label } from './components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/Select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorState, PageHeader } from './components';
import { Alert, AlertDescription } from './components/ui/Alert';
import { addRecipeFromRecipe, cookbooksQuery } from '../api/client';

export default function RecipeFromRecipeController() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: cookbooks = [] } = useQuery(cookbooksQuery());

  const addRecipeFromRecipeMutation = useMutation({
    mutationFn: ({ recipeFile, cookbookId }: { recipeFile: File; cookbookId: string }) =>
      addRecipeFromRecipe(recipeFile, cookbookId),
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      // Navigate to edit page for the newly created recipe
      navigate(`/admin/recipes/${recipe.id}/edit`);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
    else {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const cookbookId = formData.get('cookbookId') as string;

    await addRecipeFromRecipeMutation.mutateAsync({
      recipeFile: selectedFile,
      cookbookId,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Upload from Recipe"
        actions={[
          { label: 'Back to Recipes', to: '/admin/', variant: 'secondary' },
        ]}
      />

      <div className="mb-6">
        <Alert>
          <AlertDescription>
            Upload a photographed written recipe and we&apos;ll automatically extract the details using AI.
            You&apos;ll be able to review and edit the extracted data before saving.
          </AlertDescription>
        </Alert>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Written Recipe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipeFile">
                Written Recipe Image *
              </Label>
              <Input
                type="file"
                id="recipeFile"
                name="recipeFile"
                accept="image/*"
                required
                onChange={handleFileChange}
              />
              <p className="text-sm text-muted-foreground">
                Supported formats: JPG, PNG, GIF, WebP
              </p>
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg overflow-hidden max-w-md">
                  <img
                    src={previewUrl}
                    alt="Recipe preview"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cookbookId">Cookbook *</Label>
              <Select name="cookbookId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cookbook" />
                </SelectTrigger>
                <SelectContent>
                  {cookbooks.map(cookbook => (
                    <SelectItem key={cookbook.id} value={cookbook.id}>
                      {cookbook.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Associate this recipe with a cookbook
              </p>
            </div>

            <Button
              type="submit"
              disabled={!selectedFile || addRecipeFromRecipeMutation.isPending}
            >
              {addRecipeFromRecipeMutation.isPending ? 'Extracting Recipe...' : 'Extract Recipe'}
            </Button>

            {addRecipeFromRecipeMutation.isPending && (
              <Alert>
                <AlertDescription>
                  Analyzing your written recipe... This may take a few moments.
                </AlertDescription>
              </Alert>
            )}
          </form>

          {addRecipeFromRecipeMutation.error && (
            <div className="mt-4">
              <ErrorState message={addRecipeFromRecipeMutation.error.message} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
