import type { Request, Response } from 'express';
import { createRequestHandler } from '../../../../common/server/requestHandler';
import { recipesContext } from '../recipesContext';

export const getRecipes = createRequestHandler(
  {},
  async (request: Request, response: Response) => {
    const { recipesRepository } = recipesContext.get();

    const allRecipes = await recipesRepository.getAll();

    response.json(allRecipes);
  },
);
