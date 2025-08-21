import { isNull } from 'lodash-es';
import type { Identifier } from '../../application/model/identifier';
import type { FileRepository } from '../../common/persistence/FileRepository';
import { NotFoundError } from '../../common/server/error';
import type { DocumentAnalysisClient } from './server/external/DocumentAnalysisClient';
import type { RecipeRepository } from './server/persistence/recipeRepository';

type NewRecipe = {
  title: string;
  content: string;
  photoFileId?: string | null;
  recipeFileId?: string | null;
  cookbookId?: string | null;
  pageNumber?: number | null;
};

type AddRecipeArgs = {
  recipesRepository: RecipeRepository;
  recipe: NewRecipe;
};

export const addRecipe = async ({ recipesRepository, recipe }: AddRecipeArgs) => recipesRepository.insert(recipe);

type AddRecipeFromPhotoArgs = {
  recipesRepository: RecipeRepository;
  recipeFileRepository: FileRepository;
  documentAnalysisClient: DocumentAnalysisClient;
  recipeFile: File;
  cookbookId?: string | null;
};

export const addRecipeFromPhoto = async ({
  recipesRepository,
  recipeFileRepository,
  documentAnalysisClient,
  recipeFile,
  cookbookId,
}: AddRecipeFromPhotoArgs) => {
  const documentContents = await documentAnalysisClient.extractDocumentContents(recipeFile);
  const recipeFileId = await recipeFileRepository.save(new Uint8Array(await recipeFile.arrayBuffer()));

  const recipeData: NewRecipe = {
    title: documentContents.title || '',
    content: documentContents.content,
    pageNumber: documentContents.pageNumber,
    recipeFileId,
    cookbookId: cookbookId || null,
    photoFileId: null,
  };

  return recipesRepository.insert(recipeData);
};

type RecipeChanges = {
  title?: string;
  content?: string;
  photoFileId?: string | null;
  recipeFileId?: string | null;
  cookbookId?: string | null;
  pageNumber?: number | null;
};

type EditRecipeArgs = {
  recipesRepository: RecipeRepository;
  recipeId: Identifier;
  recipeChanges: RecipeChanges;
};

export const editRecipe = async ({ recipesRepository, recipeId, recipeChanges }: EditRecipeArgs) => {
  const recipe = await recipesRepository.update(recipeId, recipeChanges);

  if (isNull(recipe)) {
    throw new NotFoundError(`No recipe with ID ${recipeId} found`);
  }

  return recipe;
};

type GetRecipeArgs = {
  recipesRepository: RecipeRepository;
  recipeId: Identifier;
};

export const getRecipe = async ({ recipesRepository, recipeId }: GetRecipeArgs) => {
  const recipe = await recipesRepository.findById(recipeId);

  if (isNull(recipe)) {
    throw new NotFoundError(`No recipe with ID ${recipeId} found`);
  }

  return recipe;
};

type GetRecipesArgs = {
  recipesRepository: RecipeRepository;
};

export const getRecipes = async ({ recipesRepository }: GetRecipesArgs) => recipesRepository.getAllWithCookbooks();

type AddRecipePhotoArgs = {
  recipesRepository: RecipeRepository;
  recipePhotoFileRepository: FileRepository;
  recipeId: Identifier;
  photoFile: File;
};

export const addRecipePhoto = async ({
  recipesRepository,
  recipePhotoFileRepository,
  recipeId,
  photoFile,
}: AddRecipePhotoArgs) => {
  const recipe = await recipesRepository.findById(recipeId);

  if (isNull(recipe)) {
    throw new NotFoundError(`No recipe with ID ${recipeId} found`);
  }

  const photoFileId = await recipePhotoFileRepository.save(new Uint8Array(await photoFile.arrayBuffer()));

  return recipesRepository.update(recipeId, { photoFileId });
};

type RemoveRecipeArgs = {
  recipesRepository: RecipeRepository;
  recipePhotoFileRepository: FileRepository;
  recipeFileRepository: FileRepository;
  recipeId: Identifier;
};

export const removeRecipe = async ({ recipesRepository, recipePhotoFileRepository, recipeFileRepository, recipeId }: RemoveRecipeArgs) => {
  const recipe = await recipesRepository.findById(recipeId);
  if (!recipe) {
    throw new NotFoundError(`No recipe with ID ${recipeId} found`);
  }

  await recipesRepository.deleteById(recipeId);

  if (recipe.recipeFileId) {
    await recipeFileRepository.remove(recipe.recipeFileId);
  }
  if (recipe.photoFileId) {
    await recipePhotoFileRepository.remove(recipe.photoFileId);
  }
};
