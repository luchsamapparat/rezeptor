import { AzureKeyCredential, DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import { books } from '@googleapis/books';
import { AzureOpenAI } from 'openai';
import { database, dependency, fileRepositoryFactory } from '../../../application/server/di';
import { AzureDocumentAnalysisClient } from './AzureDocumentAnalysisClient';
import { AzureOpenAIClient } from './AzureOpenAIClient';
import { GoogleBooksClient } from './GoogleBooksClient';
import { CookbookDatabaseRepository } from './persistence/CookbookDatabaseRepository';
import type { RecipesDatabaseSchema } from './persistence/recipeDatabaseModel';
import { RecipeDatabaseRepository } from './persistence/RecipeDatabaseRepository';

export const cookbookRepository = dependency(async (_, c) => new CookbookDatabaseRepository(await database<RecipesDatabaseSchema>().resolve(c)), 'request');

const googleBooks = dependency(env => books({ version: 'v1', key: env.googleBooks.key }));
export const bookMetadataService = dependency(async (_, c) => new GoogleBooksClient(await googleBooks.resolve(c)));

const azureAiFormRecognizer = dependency(env => new DocumentAnalysisClient(
  env.azureDocumentAnalysis.endpoint,
  new AzureKeyCredential(env.azureDocumentAnalysis.key),
));
export const barcodeExtractionService = dependency(async (_, c) => new AzureDocumentAnalysisClient(await azureAiFormRecognizer.resolve(c)));

export const recipeRepository = dependency(async (_, c) => new RecipeDatabaseRepository(await database<RecipesDatabaseSchema>().resolve(c)), 'request');
export const recipeFileRepository = dependency(async (_, c) => {
  const factory = await fileRepositoryFactory.resolve(c);
  return factory.createFileRepository('recipes');
}, 'request');
export const recipePhotoFileRepository = dependency(async (_, c) => {
  const factory = await fileRepositoryFactory.resolve(c);
  return factory.createFileRepository('recipePhotos');
}, 'request');

const azureOpenAI = dependency(env => new AzureOpenAI({
  endpoint: env.azureOpenAI.endpoint,
  apiKey: env.azureOpenAI.key,
  deployment: env.azureOpenAI.deployment,
  // see https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference
  apiVersion: '2025-04-01-preview',
}));
export const recipeExtractionService = dependency(async (env, c) => new AzureOpenAIClient(
  await azureOpenAI.resolve(c),
  env.azureOpenAI.model,
  env.recipeExtraction,
));
