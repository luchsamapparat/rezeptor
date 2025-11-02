import { Button } from '@rezeptor/ui/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@rezeptor/ui/components/ui/Card';
import { Input } from '@rezeptor/ui/components/ui/Input';
import { Label } from '@rezeptor/ui/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@rezeptor/ui/components/ui/Select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorState, PageHeader } from '../../../../application/ui/components';
import { Alert, AlertDescription } from '../../../../application/ui/components/ui/Alert';
import { addRecipeFromPhoto, cookbooksQuery } from '../api/client';

export default function RecipeFromPhotoController() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: cookbooks = [] } = useQuery(cookbooksQuery());

  const addRecipeFromPhotoMutation = useMutation({
    mutationFn: ({ recipeFile, cookbookId }: { recipeFile: File; cookbookId?: string | null }) =>
      addRecipeFromPhoto(recipeFile, cookbookId),
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      // Navigate to edit page for the newly created recipe
      navigate(`/recipes/${recipe.id}/edit`);
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

    await addRecipeFromPhotoMutation.mutateAsync({
      recipeFile: selectedFile,
      cookbookId: cookbookId === '__none__' ? null : cookbookId || null,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Add Recipe from Photo"
        actions={[
          { label: 'Back to Recipes', to: '/', variant: 'secondary' },
        ]}
      />

      <div className="mb-6">
        <Alert>
          <AlertDescription>
            Upload a photo of your recipe and we&apos;ll automatically extract the recipe details using AI.
            You&apos;ll be able to review and edit the extracted data before saving.
          </AlertDescription>
        </Alert>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Recipe Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipeFile">
                Recipe Photo *
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
              <p className="text-sm text-muted-foreground">
                Associate this recipe with a cookbook
              </p>
            </div>

            <Button
              type="submit"
              disabled={!selectedFile || addRecipeFromPhotoMutation.isPending}
            >
              {addRecipeFromPhotoMutation.isPending ? 'Extracting Recipe...' : 'Extract Recipe'}
            </Button>

            {addRecipeFromPhotoMutation.isPending && (
              <Alert>
                <AlertDescription>
                  Analyzing your recipe photo... This may take a few moments.
                </AlertDescription>
              </Alert>
            )}
          </form>

          {addRecipeFromPhotoMutation.error && (
            <div className="mt-4">
              <ErrorState message={addRecipeFromPhotoMutation.error.message} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
