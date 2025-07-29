import { createRequestHandler } from '../../../../common/server/requestHandler';
import { cookbooksContext } from '../cookbooksContext';
import { cookbookIdentifierPathSchema, editCookbookDtoSchema } from './cookbookApiModel';

export const editCookbook = createRequestHandler(
  {
    paramsSchema: cookbookIdentifierPathSchema,
    requestBodySchema: editCookbookDtoSchema,
  },
  async (request, response) => {
    const { cookbooksRepository } = cookbooksContext.get();
    const { cookbookId } = request.params;
    const updates = request.body;

    const updated = await cookbooksRepository.update(cookbookId, updates);
    if (!updated.length) {
      response.status(404).json({ error: 'Cookbook not found' });
      return;
    }
    response.json(updated[0]);
  },
);
