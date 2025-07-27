import { createRequestHandler } from '../../../../common/server/requestHandler';
import { cookbooksContext } from '../cookbooksContext';
import { insertCookbookSchema } from '../persistence/cookbooksTable';

export const addCookbook = createRequestHandler(
  { requestBodySchema: insertCookbookSchema },
  async (request, response) => {
    const { cookbooksRepository } = cookbooksContext.get();

    const cookbook = await cookbooksRepository.insert(request.body);

    response.status(201).json(cookbook);
  },
);
