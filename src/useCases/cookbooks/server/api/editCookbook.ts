import { z } from 'zod';
import { createRequestHandler } from '../../../../common/server/requestHandler';
import { cookbooksContext } from '../cookbooksContext';
import { updateCookbookSchema } from '../persistence/cookbooksTable';

const editCookbookSchema = updateCookbookSchema.partial();

export const editCookbook = createRequestHandler(
  {
    requestBodySchema: editCookbookSchema,
    paramsSchema: z.object({ id: z.string() }),
  },
  async (request, response) => {
    const { cookbooksRepository } = cookbooksContext.get();
    const { id } = request.params;
    const updates = request.body;

    const updated = await cookbooksRepository.update(id, updates);
    if (!updated.length) {
      response.status(404).json({ error: 'Cookbook not found' });
      return;
    }
    response.json(updated[0]);
  },
);
