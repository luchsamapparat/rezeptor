import { Button } from '@rezeptor/ui/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@rezeptor/ui/components/ui/Card';
import { Input } from '@rezeptor/ui/components/ui/Input';
import { Label } from '@rezeptor/ui/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@rezeptor/ui/components/ui/Select';
import { Textarea } from '@rezeptor/ui/components/ui/Textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getQueryClient } from '../../../../application/client/queryClient';
import { ErrorState, LoadingState, PageHeader } from '../../../../application/ui/components';
import { addRecipePhoto, cookbooksQuery, editRecipe, recipeQuery, removeRecipe } from '../api/client';
import type { Route } from './+types/RecipeEditController';

interface Ingredient {
  quantity: string;
  unit: string;
  name: string;
  notes: string;
}

export const loader = async ({ context, params }: Route.LoaderArgs) => {
  const recipe = await getQueryClient(context).ensureQueryData(recipeQuery(params.recipeId));
  return { recipe };
};

export default function RecipeEditController({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const {
    data: recipe,
    isLoading: isLoadingRecipe,
    error: recipeError,
  } = useQuery(recipeQuery(params.recipeId, { initialData: loaderData.recipe }));

  const { data: cookbooks = [] } = useQuery(cookbooksQuery());

  // Initialize ingredients when recipe data is loaded
  useEffect(() => {
    if (recipe?.ingredients) {
      setIngredients(recipe.ingredients.map(ingredient => ({
        quantity: ingredient.quantity || '',
        unit: ingredient.unit || '',
        name: ingredient.name,
        notes: ingredient.notes || '',
      })));
    }
    else {
      setIngredients([{ quantity: '', unit: '', name: '', notes: '' }]);
    }
  }, [recipe]);

  const addIngredient = () => {
    setIngredients([...ingredients, { quantity: '', unit: '', name: '', notes: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const editRecipeMutation = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Parameters<typeof editRecipe>[1] }) =>
      editRecipe(id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipes', params.recipeId] });
      navigate('/');
    },
  });

  const addPhotoMutation = useMutation({
    mutationFn: ({ recipeId, photoFile }: { recipeId: string; photoFile: File }) =>
      addRecipePhoto(recipeId, photoFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipes', params.recipeId] });
      setSelectedPhotoFile(null);
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      setPhotoPreviewUrl(null);
    },
  });

  const removeRecipeMutation = useMutation({
    mutationFn: removeRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate('/');
    },
  });

  const handleEditRecipe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const cookbookId = formData.get('cookbookId') as string;
    const pageNumber = formData.get('pageNumber') as string;

    // Filter out empty ingredients
    const validIngredients = ingredients.filter(ingredient => ingredient.name.trim() !== '').map(ingredient => ({
      quantity: ingredient.quantity.trim() || null,
      unit: ingredient.unit.trim() || null,
      name: ingredient.name.trim(),
      notes: ingredient.notes.trim() || null,
    }));

    await editRecipeMutation.mutateAsync({
      id: params.recipeId,
      changes: {
        title: formData.get('title') as string,
        instructions: formData.get('instructions') as string,
        ingredients: validIngredients,
        cookbookId: cookbookId === '__none__' ? null : cookbookId || null,
        pageNumber: pageNumber ? Number(pageNumber) : null,
      },
    });
  };

  const handlePhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhotoFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPhotoPreviewUrl(url);
    }
    else {
      setSelectedPhotoFile(null);
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      setPhotoPreviewUrl(null);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhotoFile) return;

    await addPhotoMutation.mutateAsync({
      recipeId: params.recipeId,
      photoFile: selectedPhotoFile,
    });
  };

  const handleDeleteRecipe = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await removeRecipeMutation.mutateAsync(params.recipeId);
    }
    finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingRecipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Edit Recipe" />
        <LoadingState message="Loading recipe..." />
      </div>
    );
  }

  if (recipeError || !recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Edit Recipe" />
        <ErrorState message={recipeError instanceof Error ? recipeError.message : 'Recipe not found'} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Edit Recipe"
        actions={[
          { label: 'Back to Recipes', to: '/', variant: 'secondary' },
          {
            label: isDeleting ? 'Deleting...' : 'Delete Recipe',
            onClick: handleDeleteRecipe,
            variant: 'destructive',
            disabled: isDeleting || removeRecipeMutation.isPending,
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recipe Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEditRecipe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title *
              </Label>
              <Input
                type="text"
                id="title"
                name="title"
                defaultValue={recipe.title}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">
                Instructions *
              </Label>
              <Textarea
                id="instructions"
                name="instructions"
                defaultValue={recipe.instructions}
                required
                rows={10}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ingredients</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                  Add Ingredient
                </Button>
              </div>

              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-2">
                      <Input
                        placeholder="Qty"
                        value={ingredient.quantity}
                        onChange={e => updateIngredient(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Unit"
                        value={ingredient.unit}
                        onChange={e => updateIngredient(index, 'unit', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        placeholder="Ingredient name"
                        value={ingredient.name}
                        onChange={e => updateIngredient(index, 'name', e.target.value)}
                        required={ingredients.length === 1 && index === 0}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Notes (optional)"
                        value={ingredient.notes}
                        onChange={e => updateIngredient(index, 'notes', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      {ingredients.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cookbookId">Cookbook (Optional)</Label>
                <Select name="cookbookId" defaultValue={recipe.cookbookId || '__none__'}>
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
                  defaultValue={recipe.pageNumber || ''}
                  min={1}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={editRecipeMutation.isPending}
            >
              {editRecipeMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>

          {editRecipeMutation.error && (
            <div className="mt-4">
              <ErrorState message={editRecipeMutation.error.message} />
            </div>
          )}

          {removeRecipeMutation.error && (
            <div className="mt-4">
              <ErrorState message={removeRecipeMutation.error.message} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Upload Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recipe Photo</CardTitle>
        </CardHeader>
        <CardContent>
          {recipe.photoFileId && (
            <div className="mb-4">
              <Label>Current Photo</Label>
              <div className="border rounded-lg overflow-hidden max-w-md mt-2">
                <img
                  src={`/api/recipes/${recipe.id}/photo`}
                  alt={`Photo of ${recipe.title}`}
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photoFile">
                {recipe.photoFileId ? 'Replace Photo' : 'Add Photo'}
              </Label>
              <Input
                type="file"
                id="photoFile"
                name="photoFile"
                accept="image/*"
                onChange={handlePhotoFileChange}
              />
              <p className="text-sm text-muted-foreground">
                Supported formats: JPG, PNG, GIF, WebP
              </p>
            </div>

            {photoPreviewUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg overflow-hidden max-w-md">
                  <img
                    src={photoPreviewUrl}
                    alt="Photo preview"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            {selectedPhotoFile && (
              <Button
                type="button"
                onClick={handleUploadPhoto}
                disabled={addPhotoMutation.isPending}
              >
                {addPhotoMutation.isPending ? 'Uploading...' : 'Upload Photo'}
              </Button>
            )}
          </div>

          {addPhotoMutation.error && (
            <div className="mt-4">
              <ErrorState message={addPhotoMutation.error.message} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
