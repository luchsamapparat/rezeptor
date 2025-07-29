import { createRequestHandler } from '../../../../common/server/requestHandler';
import { recipesContext } from '../recipesContext';
import { recipeIdentifierPathSchema } from './recipeApiModel';

export const getRecipe = createRequestHandler(
  {
    paramsSchema: recipeIdentifierPathSchema,
  },
  async (request, response) => {
    const { recipesRepository } = recipesContext.get();
    const { recipeId } = request.params;

    const recipe = await recipesRepository.findById(recipeId);
    if (!recipe) {
      response.status(404).json({ error: 'Recipe not found' });
      return;
    }
    response.json(recipe);
  },
);
