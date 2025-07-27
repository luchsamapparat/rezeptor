import { z } from 'zod';
import { createRequestHandler } from '../../../../common/server/requestHandler';
import { cookbooksContext } from '../cookbooksContext';

export const removeCookbook = createRequestHandler(
  {
    paramsSchema: z.object({ id: z.string() }),
  },
  async (request, response) => {
    const { cookbooksRepository } = cookbooksContext.get();
    const { id } = request.params;

    const deleted = await cookbooksRepository.deleteById(id);
    if (!deleted.length) {
      response.status(404).json({ error: 'Cookbook not found' });
      return;
    }
    response.status(204).send();
  },
);
