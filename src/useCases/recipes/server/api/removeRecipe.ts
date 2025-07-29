import { createRequestHandler } from '../../../../common/server/requestHandler';
import { recipesContext } from '../recipesContext';
import { recipeIdentifierPathSchema } from './recipeApiModel';

export const removeRecipe = createRequestHandler(
  {
    paramsSchema: recipeIdentifierPathSchema,
  },
  async (request, response) => {
    const { recipesRepository, recipeFileRepository, recipePhotoFileRepository } = recipesContext.get();
    const { recipeId } = request.params;

    // First, get the recipe to access file IDs before deletion
    const existingRecipe = await recipesRepository.findById(recipeId);
    if (!existingRecipe) {
      response.status(404).json({ error: 'Recipe not found' });
      return;
    }

    // Delete the recipe from database
    await recipesRepository.deleteById(recipeId);

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
