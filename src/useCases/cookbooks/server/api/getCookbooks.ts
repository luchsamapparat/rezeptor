import type { Request, Response } from 'express';
import { createRequestHandler } from '../../../../common/server/requestHandler';
import { cookbooksContext } from '../cookbooksContext';

export const getCookbooks = createRequestHandler(
  {},
  async (request: Request, response: Response) => {
    const { cookbooksRepository } = cookbooksContext.get();

    const allCookbooks = await cookbooksRepository.getAll();

    response.json(allCookbooks);
  },
);
