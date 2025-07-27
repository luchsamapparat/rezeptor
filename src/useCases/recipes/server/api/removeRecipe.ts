import { z } from 'zod';
import { createRequestHandler } from '../../../../common/server/requestHandler';
import { recipesContext } from '../recipesContext';

export const removeRecipe = createRequestHandler(
  {
    paramsSchema: z.object({ id: z.string() }),
  },
  async (request, response) => {
    const { recipesRepository } = recipesContext.get();
    const { id } = request.params;

    const deleted = await recipesRepository.deleteById(id);
    if (!deleted.length) {
      response.status(404).json({ error: 'Recipe not found' });
      return;
    }
    response.status(204).send();
  },
);
