import { createRequestHandler } from '../../../../common/server/requestHandler';
import { cookbooksContext } from '../cookbooksContext';
import { cookbookIdentifierPathSchema } from './cookbookApiModel';

export const removeCookbook = createRequestHandler(
  {
    paramsSchema: cookbookIdentifierPathSchema,
  },
  async (request, response) => {
    const { cookbooksRepository } = cookbooksContext.get();
    const { cookbookId } = request.params;

    const deleted = await cookbooksRepository.deleteById(cookbookId);
    if (!deleted.length) {
      response.status(404).json({ error: 'Cookbook not found' });
      return;
    }
    response.status(204).send();
  },
);
