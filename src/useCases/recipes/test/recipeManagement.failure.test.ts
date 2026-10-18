import { expect, it, vi } from 'vitest';
import { addRecipeFromPhoto, completeRecipeFromRecipe, type RecipeExtractionService, type RecipeFileRepository, type FoodPhotoFileRepository, type RecipeRepository } from '../recipeManagement';

const recipeFile = new File(['image'], 'written.jpg', { type: 'image/jpeg' });
const photoFile = new File(['image'], 'dinner.jpg', { type: 'image/jpeg' });
const recipeId = 'a59f13c4-6130-4e40-931b-e4937f423846';
const cookbookId = '6f9d2949-f08c-4970-abce-7b75e6fa43c0';

it('removes a newly stored photo if recipe insertion fails', async () => {
  const insert = vi.fn().mockRejectedValue(new Error('database failed'));
  const save = vi.fn().mockResolvedValue('new-photo');
  const remove = vi.fn().mockResolvedValue(undefined);

  await expect(addRecipeFromPhoto({
    recipeRepository: { insert } as unknown as RecipeRepository,
    foodPhotoFileRepository: { save, remove } as unknown as FoodPhotoFileRepository,
    title: 'Dinner',
    photoFile,
  })).rejects.toThrow('database failed');
  expect(remove).toHaveBeenCalledWith('new-photo');
});

it('does not extract or store a written recipe when the recipe is missing', async () => {
  const extractRecipeContents = vi.fn();
  const save = vi.fn();
  await expect(completeRecipeFromRecipe({
    recipeRepository: { findById: vi.fn().mockResolvedValue(null) } as unknown as RecipeRepository,
    recipeFileRepository: { save } as unknown as RecipeFileRepository,
    recipeExtractionService: { extractRecipeContents } as RecipeExtractionService,
    recipeId,
    cookbookId,
    recipeFile,
  })).rejects.toThrow('No recipe');
  expect(extractRecipeContents).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
});

it('removes a newly stored written recipe if the database update fails', async () => {
  const remove = vi.fn().mockResolvedValue(undefined);
  const existing = { id: recipeId, title: 'Dinner', recipeFileId: 'old-file', photoFileId: 'food-photo' };
  await expect(completeRecipeFromRecipe({
    recipeRepository: {
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockRejectedValue(new Error('database failed')),
    } as unknown as RecipeRepository,
    recipeFileRepository: { save: vi.fn().mockResolvedValue('new-file'), remove } as unknown as RecipeFileRepository,
    recipeExtractionService: { extractRecipeContents: vi.fn().mockResolvedValue({ title: 'Extracted', instructions: null, ingredients: [], pageNumber: null }) },
    recipeId,
    cookbookId,
    recipeFile,
  })).rejects.toThrow('database failed');
  expect(remove).toHaveBeenCalledExactlyOnceWith('new-file');
});
