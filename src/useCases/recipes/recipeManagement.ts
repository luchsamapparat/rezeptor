import { isNull } from 'lodash-es';
import type { Identifier } from '../../application/model/identifier';
import { NotFoundError } from '../../common/server/error';
import type { Cookbook } from './cookbookManagement';

export type RecipeRepository = {
  insert(newRecipe: NewRecipe): Promise<Recipe>;
  update(recipeId: Identifier, changes: RecipeChanges): Promise<Recipe | null>;
  findById(recipeId: Identifier): Promise<Recipe | null>;
  getAllWithCookbooks(): Promise<RecipeWithCookbook[]>;
  deleteById(recipeId: Identifier): Promise<Recipe | null>;
};

export type RecipeFileRepository = {
  save(file: File): Promise<string>;
  remove(filename: string): Promise<void>;
};

export type RecipePhotoFileRepository = {
  save(file: File): Promise<string>;
  remove(filename: string): Promise<void>;
};

export type RecipeContentExtractionService = {
  extractRecipeContents(file: File): Promise<RecipeContents>;
};

export type RecipeContents = {
  title: string | null;
  pageNumber: number | null;
  content: string;
};

type Recipe = {
  id: Identifier;
  title: string;
  content: string;
  photoFileId: string | null;
  recipeFileId: string | null;
  cookbookId: string | null;
  pageNumber: number | null;
};

type RecipeWithCookbook = Recipe & {
  cookbook: Cookbook | null;
};

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
  recipeFileRepository: RecipeFileRepository;
  recipeContentExtractionService: RecipeContentExtractionService;
  recipeFile: File;
  cookbookId?: string | null;
};

export const addRecipeFromPhoto = async ({
  recipesRepository,
  recipeFileRepository,
  recipeContentExtractionService,
  recipeFile,
  cookbookId,
}: AddRecipeFromPhotoArgs) => {
  const recipeContents = await recipeContentExtractionService.extractRecipeContents(recipeFile);
  const recipeFileId = await recipeFileRepository.save(recipeFile);

  const recipeData: NewRecipe = {
    title: recipeContents.title || '',
    content: recipeContents.content,
    pageNumber: recipeContents.pageNumber,
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
    throw new NotFoundError(`No recipe with ID ${recipeId} found.`);
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
    throw new NotFoundError(`No recipe with ID ${recipeId} found.`);
  }

  return recipe;
};

type GetRecipesArgs = {
  recipesRepository: RecipeRepository;
};

export const getRecipes = async ({ recipesRepository }: GetRecipesArgs) => recipesRepository.getAllWithCookbooks();

type AddRecipePhotoArgs = {
  recipesRepository: RecipeRepository;
  recipePhotoFileRepository: RecipePhotoFileRepository;
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
    throw new NotFoundError(`No recipe with ID ${recipeId} found.`);
  }

  const photoFileId = await recipePhotoFileRepository.save(photoFile);

  return recipesRepository.update(recipeId, { photoFileId });
};

type RemoveRecipeArgs = {
  recipesRepository: RecipeRepository;
  recipePhotoFileRepository: RecipePhotoFileRepository;
  recipeFileRepository: RecipeFileRepository;
  recipeId: Identifier;
};

export const removeRecipe = async ({ recipesRepository, recipePhotoFileRepository, recipeFileRepository, recipeId }: RemoveRecipeArgs) => {
  const recipe = await recipesRepository.findById(recipeId);
  if (!recipe) {
    throw new NotFoundError(`No recipe with ID ${recipeId} found.`);
  }

  await recipesRepository.deleteById(recipeId);

  if (recipe.recipeFileId) {
    await recipeFileRepository.remove(recipe.recipeFileId);
  }
  if (recipe.photoFileId) {
    await recipePhotoFileRepository.remove(recipe.photoFileId);
  }
};
