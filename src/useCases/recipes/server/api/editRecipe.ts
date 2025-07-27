import { z } from 'zod';
import { createRequestHandler } from '../../../../common/server/requestHandler';
import { updateRecipeSchema } from '../persistence/recipesTable';
import { recipesContext } from '../recipesContext';

const editRecipeSchema = updateRecipeSchema.partial();

export const editRecipe = createRequestHandler(
  {
    requestBodySchema: editRecipeSchema,
    paramsSchema: z.object({ id: z.string() }),
  },
  async (request, response) => {
    const { recipesRepository } = recipesContext.get();
    const { id } = request.params;
    const updates = request.body;

    const updated = await recipesRepository.update(id, updates);
    if (!updated.length) {
      response.status(404).json({ error: 'Recipe not found' });
      return;
    }
    response.json(updated[0]);
  },
);
