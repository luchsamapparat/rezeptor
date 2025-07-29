import { z } from 'zod';
import { createRequestHandler } from '../../../../common/server/requestHandler';
import { recipesContext } from '../recipesContext';

export const removeRecipe = createRequestHandler(
  {
    paramsSchema: z.object({ id: z.string() }),
  },
  async (request, response) => {
    const { recipesRepository, recipeFileRepository, recipePhotoFileRepository } = recipesContext.get();
    const { id } = request.params;

    // First, get the recipe to access file IDs before deletion
    const existingRecipe = await recipesRepository.findById(id);
    if (!existingRecipe) {
      response.status(404).json({ error: 'Recipe not found' });
      return;
    }

    // Delete the recipe from database
    await recipesRepository.deleteById(id);

    // Clean up associated files
    if (existingRecipe.photoFileId) {
      await recipePhotoFileRepository.remove(existingRecipe.photoFileId);
    }
    if (existingRecipe.recipeFileId) {
      await recipeFileRepository.remove(existingRecipe.recipeFileId);
    }

    response.status(204).send();
  },
);
