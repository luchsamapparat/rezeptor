import { createRequestHandler } from '../../../../common/server/requestHandler';
import { insertRecipeSchema } from '../persistence/recipesTable';
import { recipesContext } from '../recipesContext';

export const addRecipe = createRequestHandler(
  { requestBodySchema: insertRecipeSchema },
  async (request, response) => {
    const { recipesRepository } = recipesContext.get();

    const recipe = await recipesRepository.insert(request.body);

    response.status(201).json(recipe);
  },
);
