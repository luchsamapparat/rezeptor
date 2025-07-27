import { z } from 'zod';
import { createRequestHandler } from '../../../../common/server/requestHandler';
import { recipesContext } from '../recipesContext';

export const getRecipe = createRequestHandler(
  {
    paramsSchema: z.object({ id: z.string() }),
  },
  async (request, response) => {
    const { recipesRepository } = recipesContext.get();
    const { id } = request.params;

    const recipe = await recipesRepository.findById(id);
    if (!recipe) {
      response.status(404).json({ error: 'Recipe not found' });
      return;
    }
    response.json(recipe);
  },
);
