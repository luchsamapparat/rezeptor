import { isNull } from 'lodash-es';
import type { Identifier } from '../../application/model/identifier';
import type { FileRepository } from '../../common/persistence/FileRepository';
import { NotFoundError } from '../../common/server/error';
import type { Cookbook } from './cookbookManagement';

/**
 * Repository interface for recipe persistence operations.
 * Provides CRUD operations for recipes and supports querying recipes with their associated cookbooks.
 */
export type RecipeRepository = {
  insert(newRecipe: NewRecipe): Promise<Recipe>;
  update(recipeId: Identifier, changes: RecipeChanges): Promise<Recipe | null>;
  findById(recipeId: Identifier): Promise<Recipe | null>;
  getAllWithCookbooks(): Promise<RecipeWithCookbook[]>;
  deleteById(recipeId: Identifier): Promise<Recipe | null>;
};

/**
 * Repository interface for managing recipe file storage.
 * Handles saving and removing recipe source files (e.g., photographed recipe pages from cookbooks).
 */
export type RecipeFileRepository = {
  save(file: File): Promise<string>;
  remove(filename: string): Promise<void>;
};

/**
 * Repository interface for managing recipe photo storage.
 * Handles saving and removing recipe photos.
 */
export type RecipePhotoFileRepository = {
  save(file: File): Promise<string>;
  remove(filename: string): Promise<void>;
};

/**
 * Service interface for extracting recipe data from recipe source files (e.g., photographed recipe pages from cookbooks).
 * Uses external services to extract structured recipe information.
 */
export type RecipeExtractionService = {
  extractRecipeContents(file: File): Promise<RecipeContents>;
};

/**
 * Represents extracted recipe contents from a recipe source file.
 */
export type RecipeContents = {
  title: string | null;
  pageNumber: number | null;
  instructions: string;
  ingredients: Ingredient[];
};

export type Ingredient = {
  quantity: string | null;
  unit: string | null;
  name: string;
  notes: string | null;
};

export type Recipe = {
  id: Identifier;
  title: string;
  instructions: string;
  ingredients: Ingredient[];
  photoFileId: string | null;
  recipeFileId: string | null;
  cookbookId: string | null;
  pageNumber: number | null;
};

export type RecipeWithCookbook = Recipe & {
  cookbook: Cookbook | null;
};

export type NewRecipe = {
  title: string;
  instructions: string;
  ingredients: Ingredient[];
  photoFileId?: string | null;
  recipeFileId?: string | null;
  cookbookId?: string | null;
  pageNumber?: number | null;
};

type AddRecipeArgs = {
  recipesRepository: RecipeRepository;
  recipe: NewRecipe;
};

/**
 * Adds a new recipe to the repository.
 *
 * @param args - The arguments containing the repository and recipe data
 * @param args.recipesRepository - Repository for persisting recipes
 * @param args.recipe - The new recipe data to insert
 * @returns Promise resolving to the created recipe with generated ID
 */
export const addRecipe = async ({ recipesRepository, recipe }: AddRecipeArgs) => recipesRepository.insert(recipe);

type AddRecipeFromPhotoArgs = {
  recipesRepository: RecipeRepository;
  recipeFileRepository: RecipeFileRepository;
  recipeExtractionService: RecipeExtractionService;
  recipeFile: File;
  cookbookId?: string | null;
};

/**
 * Creates a new recipe by extracting contents from a photo file.
 * Uses the recipe extraction service to extract and parse recipe information,
 * then saves both the file and extracted data.
 *
 * @param args - The arguments containing repositories, services, and file data
 * @param args.recipesRepository - Repository for persisting recipes
 * @param args.recipeFileRepository - Repository for storing recipe files
 * @param args.recipeExtractionService - Service for extracting recipe data from files
 * @param args.recipeFile - The image file containing the recipe
 * @param args.cookbookId - Optional cookbook ID to associate the recipe with
 * @returns Promise resolving to the created recipe
 */
export const addRecipeFromPhoto = async ({
  recipesRepository,
  recipeFileRepository,
  recipeExtractionService,
  recipeFile,
  cookbookId,
}: AddRecipeFromPhotoArgs) => {
  const recipeContents = await recipeExtractionService.extractRecipeContents(recipeFile);
  const recipeFileId = await recipeFileRepository.save(recipeFile);

  const recipeData: NewRecipe = {
    title: recipeContents.title || '',
    instructions: recipeContents.instructions,
    ingredients: recipeContents.ingredients,
    pageNumber: recipeContents.pageNumber,
    recipeFileId,
    cookbookId: cookbookId || null,
    photoFileId: null,
  };

  return recipesRepository.insert(recipeData);
};

export type RecipeChanges = {
  title?: string;
  instructions?: string;
  ingredients?: Ingredient[];
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

/**
 * Updates an existing recipe with the provided changes.
 *
 * @param args - The arguments containing the repository, recipe ID, and changes
 * @param args.recipesRepository - Repository for persisting recipes
 * @param args.recipeId - ID of the recipe to update
 * @param args.recipeChanges - Partial recipe data containing fields to update
 * @returns Promise resolving to the updated recipe
 * @throws {NotFoundError} If no recipe with the given ID exists
 */
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

/**
 * Retrieves a single recipe by its ID.
 *
 * @param args - The arguments containing the repository and recipe ID
 * @param args.recipesRepository - Repository for retrieving recipes
 * @param args.recipeId - ID of the recipe to retrieve
 * @returns Promise resolving to the recipe
 * @throws {NotFoundError} If no recipe with the given ID exists
 */
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

/**
 * Retrieves all recipes with their associated cookbook information.
 *
 * @param args - The arguments containing the repository
 * @param args.recipesRepository - Repository for retrieving recipes
 * @returns Promise resolving to an array of recipes with cookbook data
 */
export const getRecipes = async ({ recipesRepository }: GetRecipesArgs) => recipesRepository.getAllWithCookbooks();

type AddRecipePhotoArgs = {
  recipesRepository: RecipeRepository;
  recipePhotoFileRepository: RecipePhotoFileRepository;
  recipeId: Identifier;
  photoFile: File;
};

/**
 * Adds a photo to an existing recipe.
 * Saves the photo file and updates the recipe with the photo file ID.
 *
 * @param args - The arguments containing repositories, recipe ID, and photo file
 * @param args.recipesRepository - Repository for persisting recipes
 * @param args.recipePhotoFileRepository - Repository for storing photo files
 * @param args.recipeId - ID of the recipe to add the photo to
 * @param args.photoFile - The photo file to add
 * @returns Promise resolving to the updated recipe
 * @throws {NotFoundError} If no recipe with the given ID exists
 */
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

type GetRecipePhotoArgs = {
  recipesRepository: RecipeRepository;
  recipePhotoFileRepository: FileRepository;
  recipeId: Identifier;
};

/**
 * Retrieves the photo file data for a recipe.
 *
 * @param args - The arguments containing repositories and recipe ID
 * @param args.recipesRepository - Repository for retrieving recipes
 * @param args.recipePhotoFileRepository - Repository for retrieving photo files
 * @param args.recipeId - ID of the recipe to get the photo for
 * @returns Promise resolving to the photo file data
 * @throws {NotFoundError} If no recipe with the given ID exists or if the recipe has no photo
 */
export const getRecipePhoto = async ({ recipesRepository, recipePhotoFileRepository, recipeId }: GetRecipePhotoArgs) => {
  const recipe = await recipesRepository.findById(recipeId);

  if (isNull(recipe)) {
    throw new NotFoundError(`No recipe with ID ${recipeId} found`);
  }

  if (isNull(recipe.photoFileId)) {
    throw new NotFoundError(`Recipe with ID ${recipeId} has no photo`);
  }

  const photoData = await recipePhotoFileRepository.get(recipe.photoFileId);
  return photoData;
};

type RemoveRecipeArgs = {
  recipesRepository: RecipeRepository;
  recipePhotoFileRepository: RecipePhotoFileRepository;
  recipeFileRepository: RecipeFileRepository;
  recipeId: Identifier;
};

/**
 * Removes a recipe and all associated files.
 * Deletes the recipe from the repository and removes any associated photo and recipe files.
 *
 * @param args - The arguments containing repositories and recipe ID
 * @param args.recipesRepository - Repository for persisting recipes
 * @param args.recipePhotoFileRepository - Repository for photo file storage
 * @param args.recipeFileRepository - Repository for recipe file storage
 * @param args.recipeId - ID of the recipe to remove
 * @returns Promise that resolves when the recipe and files are removed
 * @throws {NotFoundError} If no recipe with the given ID exists
 */
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
