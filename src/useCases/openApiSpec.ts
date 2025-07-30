import { OpenApiSpecGenerator, type ApiEndpoint } from '../common/server/openapi/specGenerator';

// Import all your API schemas
import {
  addRecipeDtoSchema,
  editRecipeDtoSchema,
  recipeIdentifierPathSchema,
  recipesPath,
} from './recipes/server/api/recipeApiModel';

import {
  addCookbookDtoSchema,
  editCookbookDtoSchema,
  cookbookIdentifierPathSchema,
  cookbooksPath,
} from './cookbooks/server/api/cookbookApiModel';

/**
 * Generate the complete OpenAPI specification for the Rezeptor API
 */
export function generateRezeptorApiSpec() {
  const generator = new OpenApiSpecGenerator({
    openapi: '3.0.0',
    info: {
      title: 'Rezeptor API',
      version: '1.0.0',
      description: 'API for managing recipes and cookbooks in the Rezeptor application',
    },
    servers: [
      {
        url: '/api',
        description: 'API server',
      },
    ],
  });

  // Register all recipe endpoints
  const recipeEndpoints: ApiEndpoint[] = [
    {
      path: recipesPath,
      method: 'get',
      tags: ['Recipes'],
      summary: 'Get all recipes',
      description: 'Retrieve a list of all recipes',
    },
    {
      path: recipesPath,
      method: 'post',
      tags: ['Recipes'],
      summary: 'Add a new recipe',
      description: 'Create a new recipe from data or photo',
      requestBodySchema: addRecipeDtoSchema,
    },
    {
      path: `${recipesPath}/{recipeId}`,
      method: 'get',
      tags: ['Recipes'],
      summary: 'Get a recipe by ID',
      description: 'Retrieve a specific recipe by its ID',
      paramsSchema: recipeIdentifierPathSchema,
    },
    {
      path: `${recipesPath}/{recipeId}`,
      method: 'patch',
      tags: ['Recipes'],
      summary: 'Update a recipe',
      description: 'Update an existing recipe',
      paramsSchema: recipeIdentifierPathSchema,
      requestBodySchema: editRecipeDtoSchema,
    },
    {
      path: `${recipesPath}/{recipeId}`,
      method: 'delete',
      tags: ['Recipes'],
      summary: 'Delete a recipe',
      description: 'Remove a recipe and its associated files',
      paramsSchema: recipeIdentifierPathSchema,
    },
    {
      path: `${recipesPath}/{recipeId}/photo`,
      method: 'put',
      tags: ['Recipes'],
      summary: 'Add or update recipe photo',
      description: 'Upload a photo for a recipe',
      paramsSchema: recipeIdentifierPathSchema,
      fileUpload: {
        fieldName: 'photoFile',
        required: true,
        acceptedMimeTypes: ['image/*'],
        maxSize: 5 * 1024 * 1024, // 5MB
      },
    },
  ];

  // Register all cookbook endpoints
  const cookbookEndpoints: ApiEndpoint[] = [
    {
      path: cookbooksPath,
      method: 'get',
      tags: ['Cookbooks'],
      summary: 'Get all cookbooks',
      description: 'Retrieve a list of all cookbooks',
    },
    {
      path: cookbooksPath,
      method: 'post',
      tags: ['Cookbooks'],
      summary: 'Add a new cookbook',
      description: 'Create a new cookbook',
      requestBodySchema: addCookbookDtoSchema,
    },
    {
      path: `${cookbooksPath}/identification`,
      method: 'post',
      tags: ['Cookbooks'],
      summary: 'Identify cookbook from document',
      description: 'Use AI to identify cookbook details from an uploaded document',
      fileUpload: {
        fieldName: 'document',
        required: true,
        acceptedMimeTypes: ['image/*', 'application/pdf'],
        maxSize: 10 * 1024 * 1024, // 10MB
      },
    },
    {
      path: `${cookbooksPath}/{cookbookId}`,
      method: 'patch',
      tags: ['Cookbooks'],
      summary: 'Update a cookbook',
      description: 'Update an existing cookbook',
      paramsSchema: cookbookIdentifierPathSchema,
      requestBodySchema: editCookbookDtoSchema,
    },
    {
      path: `${cookbooksPath}/{cookbookId}`,
      method: 'delete',
      tags: ['Cookbooks'],
      summary: 'Delete a cookbook',
      description: 'Remove a cookbook',
      paramsSchema: cookbookIdentifierPathSchema,
    },
  ];

  // Register all endpoints
  [...recipeEndpoints, ...cookbookEndpoints].forEach((endpoint) => {
    generator.registerEndpoint(endpoint);
  });

  return generator.generateSpec();
}

/**
 * Export the OpenAPI spec as JSON
 */
export function getOpenApiSpecJson(): string {
  return JSON.stringify(generateRezeptorApiSpec(), null, 2);
}

/**
 * Generate OpenAPI spec and save to file
 */
export async function saveOpenApiSpec(filePath: string): Promise<void> {
  const fs = await import('fs/promises');
  const spec = generateRezeptorApiSpec();
  await fs.writeFile(filePath, JSON.stringify(spec, null, 2));
}
