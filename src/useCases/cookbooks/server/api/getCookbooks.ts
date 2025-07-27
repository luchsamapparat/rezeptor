import type { Request, Response } from 'express';
import { cookbooksContext } from '../cookbooksContext';

export const getCookbooks = [
  async (request: Request, response: Response) => {
    const { cookbooksRepository } = cookbooksContext.get();

    const allCookbooks = await cookbooksRepository.getAll();

    response.json(allCookbooks);
  },
];
