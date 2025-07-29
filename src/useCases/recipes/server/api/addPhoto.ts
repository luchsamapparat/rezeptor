import { z } from 'zod';
import { createRequestHandler } from '../../../../common/server/requestHandler';
import { recipesContext } from '../recipesContext';

export const addPhoto = createRequestHandler(
  {
    paramsSchema: z.object({ id: z.string() }),
    fileUpload: {
      fieldName: 'photoFile',
      required: true,
      acceptedMimeTypes: ['image/*'],
      maxSize: 5 * 1024 * 1024, // 5MB
    },
  } as const,
  async (request, response) => {
    const { recipesRepository, recipePhotoFileRepository } = recipesContext.get();
    const { id } = request.params;

    try {
      // Check if recipe exists
      const existingRecipe = await recipesRepository.findById(id);
      if (!existingRecipe) {
        response.status(404).json({ error: 'Recipe not found' });
        return;
      }

      // If recipe already has a photo, remove the old file
      if (existingRecipe.photoFileId) {
        try {
          await recipePhotoFileRepository.remove(existingRecipe.photoFileId);
        }
        catch (error) {
          console.warn('Failed to remove old photo file:', error);
          // Continue with upload even if old file removal fails
        }
      }

      // Save the new photo file
      const photoFileId = await recipePhotoFileRepository.save(new Uint8Array(await request.file.arrayBuffer()));

      // Update the recipe with the new photo file ID
      const updated = await recipesRepository.update(id, { photoFileId });

      if (!updated.length) {
        response.status(404).json({ error: 'Recipe not found' });
        return;
      }

      response.json(updated[0]);
    }
    catch (error) {
      console.error('Error adding photo to recipe:', error);
      response.status(500).json({
        error: 'Failed to add photo. Please try again.',
      });
    }
  },
);
