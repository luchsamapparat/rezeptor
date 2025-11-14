import { AzureKeyCredential, DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import { books } from '@googleapis/books';
import { AzureOpenAI } from 'openai';
import { createChildLogger, database, dependency, fileRepositoryFactory, logger } from '../../../application/server/di';
import type { Logger } from '../../../application/server/logging';
import { AzureDocumentAnalysisBarcodeExtractionService } from './AzureDocumentAnalysisBarcodeExtractionService';
import { AzureOpenAIRecipeExtractionService } from './AzureOpenAIRecipeExtractionService';
import { GoogleBooksBookMetadataService } from './GoogleBooksBookMetadataService';
import { CookbookDatabaseRepository } from './persistence/CookbookDatabaseRepository';
import type { RecipesDatabaseSchema } from './persistence/recipeDatabaseModel';
import { RecipeDatabaseRepository } from './persistence/RecipeDatabaseRepository';

const useCaseLogger = dependency(async (_, c): Promise<Logger> => {
  const rootLogger = await logger.resolve(c);
  return rootLogger.child({ useCase: 'recipes' });
}, 'request');

export const cookbookRepository = dependency(async (_, c) => {
  const db = await database<RecipesDatabaseSchema>().resolve(c);
  const logger = await createChildLogger(c, useCaseLogger, { component: 'CookbookDatabaseRepository' });
  return new CookbookDatabaseRepository(db, logger);
}, 'request');

const googleBooks = dependency(env => books({ version: 'v1', key: env.googleBooks.key }));
export const bookMetadataService = dependency(async (_, c) => {
  const books = await googleBooks.resolve(c);
  const logger = await createChildLogger(c, useCaseLogger, { component: 'GoogleBooksBookMetadataService' });
  return new GoogleBooksBookMetadataService(books, logger);
});

const azureAiFormRecognizer = dependency(env => new DocumentAnalysisClient(
  env.azureDocumentAnalysis.endpoint,
  new AzureKeyCredential(env.azureDocumentAnalysis.key),
));
export const barcodeExtractionService = dependency(async (_, c) => {
  const client = await azureAiFormRecognizer.resolve(c);
  const logger = await createChildLogger(c, useCaseLogger, { component: 'AzureDocumentAnalysisBarcodeExtractionService' });
  return new AzureDocumentAnalysisBarcodeExtractionService(client, logger);
});

export const recipeRepository = dependency(async (_, c) => {
  const db = await database<RecipesDatabaseSchema>().resolve(c);
  const logger = await createChildLogger(c, useCaseLogger, { component: 'RecipeDatabaseRepository' });
  return new RecipeDatabaseRepository(db, logger);
}, 'request');
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
export const recipeExtractionService = dependency(async (env, c) => {
  const client = await azureOpenAI.resolve(c);
  const logger = await createChildLogger(c, useCaseLogger, { component: 'AzureOpenAIRecipeExtractionService' });
  return new AzureOpenAIRecipeExtractionService(
    client,
    env.azureOpenAI.model,
    env.recipeExtraction,
    logger,
  );
});
