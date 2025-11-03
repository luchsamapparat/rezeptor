import { Button } from '@rezeptor/ui/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@rezeptor/ui/components/ui/Card';
import { Input } from '@rezeptor/ui/components/ui/Input';
import { Label } from '@rezeptor/ui/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@rezeptor/ui/components/ui/Select';
import { Textarea } from '@rezeptor/ui/components/ui/Textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorState, PageHeader } from '../../../../application/ui/components';
import { addRecipe, cookbooksQuery } from '../api/client';

interface Ingredient {
  quantity: string;
  unit: string;
  name: string;
  notes: string;
}

export default function RecipeFormController() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { quantity: '', unit: '', name: '', notes: '' },
  ]);

  const { data: cookbooks = [] } = useQuery(cookbooksQuery());

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

    // Filter out empty ingredients
    const validIngredients = ingredients.filter(ingredient => ingredient.name.trim() !== '').map(ingredient => ({
      quantity: ingredient.quantity.trim() || null,
      unit: ingredient.unit.trim() || null,
      name: ingredient.name.trim(),
      notes: ingredient.notes.trim() || null,
    }));

    await addRecipeMutation.mutateAsync({
      title: formData.get('title') as string,
      instructions: formData.get('instructions') as string,
      ingredients: validIngredients,
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
              <Label htmlFor="instructions">
                Instructions *
              </Label>
              <Textarea
                id="instructions"
                name="instructions"
                required
                rows={8}
                placeholder="Enter step-by-step instructions for preparing this recipe..."
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
