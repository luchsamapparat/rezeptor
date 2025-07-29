import type { DocumentAnalysisClient } from '../../../application/server/DocumentAnalysisClient';
import type { FileRepository } from '../../../common/persistence/FileRepository';
import { createRequestContextStore } from '../../../common/server/requestContextStore';
import type { RecipeRepository } from './persistence/recipeRepository';

type RecipesContext = {
  recipesRepository: RecipeRepository;
  recipeFileRepository: FileRepository;
  documentAnalysisClient: DocumentAnalysisClient;
};

export const recipesContext = createRequestContextStore<RecipesContext>('RecipesContext');
