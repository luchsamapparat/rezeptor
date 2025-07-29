import { createRequestHandler } from '../../../../common/server/requestHandler';
import { recipesContext } from '../recipesContext';
import { editRecipeDtoSchema, recipeIdentifierPathSchema } from './recipeApiModel';

export const editRecipe = createRequestHandler(
  {
    paramsSchema: recipeIdentifierPathSchema,
    requestBodySchema: editRecipeDtoSchema,
  },
  async (request, response) => {
    const { recipesRepository } = recipesContext.get();
    const { recipeId } = request.params;
    const updates = request.body;

    const updated = await recipesRepository.update(recipeId, updates);
    if (!updated.length) {
      response.status(404).json({ error: 'Recipe not found' });
      return;
    }
    response.json(updated[0]);
  },
);
