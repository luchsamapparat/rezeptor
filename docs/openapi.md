# OpenAPI Specification for Rezeptor

This document describes how to generate and use the OpenAPI specification for the Rezeptor API.

## Overview

The Rezeptor API now automatically generates an OpenAPI 3.0 specification from your existing Zod schemas and `createRequestHandler` patterns. This provides:

- 📋 **Automatic API documentation** from your existing code
- 🔧 **Type-safe validation** with Zod schemas
- 🌐 **Interactive Swagger UI** for testing endpoints
- 📄 **JSON and YAML formats** for integration with other tools

## Quick Start

### 1. Generate OpenAPI Spec Files

```bash
npm run openapi:generate
```

This creates:
- `openapi.json` - OpenAPI specification in JSON format
- `openapi.yaml` - OpenAPI specification in YAML format

### 2. View Interactive Documentation

Start your development server:

```bash
npm run dev
```

Then visit: `http://localhost:3000/api/docs`

### 3. Access Raw Specifications

- JSON: `http://localhost:3000/api/openapi.json`
- YAML: `http://localhost:3000/api/openapi.yaml`

## Adding OpenAPI Metadata to Your APIs

### Basic Schema Enhancement

Update your Zod schemas with OpenAPI metadata:

```typescript
// Before
export const addRecipeDtoSchema = insertRecipeEntitySchema;

// After
export const addRecipeDtoSchema = insertRecipeEntitySchema.openapi({
  example: {
    title: 'Pasta Carbonara',
    description: 'Classic Italian pasta dish',
    cookbookId: '123e4567-e89b-12d3-a456-426614174000',
  },
});
```

### New Endpoint Registration

To add a new endpoint to the OpenAPI spec, update `src/useCases/openApiSpec.ts`:

```typescript
const newEndpoint: ApiEndpoint = {
  path: '/my-new-endpoint',
  method: 'post',
  tags: ['MyFeature'],
  summary: 'Create something new',
  description: 'Detailed description of what this endpoint does',
  requestBodySchema: myRequestSchema,  // Your Zod schema
  responseSchema: myResponseSchema,    // Optional response schema
};

// Add to the appropriate endpoints array
const myEndpoints: ApiEndpoint[] = [
  // ... existing endpoints
  newEndpoint,
];
```

## Current API Coverage

### Recipes API (`/api/recipes`)

- `GET /recipes` - Get all recipes
- `POST /recipes` - Add new recipe (JSON or multipart/form-data)
- `GET /recipes/{recipeId}` - Get recipe by ID
- `PATCH /recipes/{recipeId}` - Update recipe
- `DELETE /recipes/{recipeId}` - Delete recipe
- `PUT /recipes/{recipeId}/photo` - Upload recipe photo

### Cookbooks API (`/api/cookbooks`)

- `GET /cookbooks` - Get all cookbooks
- `POST /cookbooks` - Add new cookbook
- `POST /cookbooks/identification` - AI-powered cookbook identification
- `PATCH /cookbooks/{cookbookId}` - Update cookbook
- `DELETE /cookbooks/{cookbookId}` - Delete cookbook

## Integration with External Tools

### Postman

1. Import the generated `openapi.json` file into Postman
2. Postman will automatically create a collection with all endpoints
3. Example requests and schemas will be pre-populated

### API Clients

Generate type-safe clients using tools like:

```bash
# OpenAPI Generator
npx @openapitools/openapi-generator-cli generate \
  -i openapi.json \
  -g typescript-fetch \
  -o ./generated-client

# Or swagger-codegen
swagger-codegen generate \
  -i openapi.json \
  -l typescript-angular \
  -o ./generated-client
```

## Customization

### Adding Response Schemas

Currently, most endpoints return generic success responses. To add specific response schemas:

1. Define your response schema with Zod and OpenAPI metadata:

```typescript
const recipeResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  // ... other fields
}).openapi({
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Pasta Carbonara',
    description: 'Delicious Italian pasta dish',
  },
});
```

2. Add it to your endpoint definition:

```typescript
{
  path: '/recipes/{recipeId}',
  method: 'get',
  // ... other properties
  responseSchema: recipeResponseSchema,
}
```

### Custom Error Responses

Add error response schemas:

```typescript
const errorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
}).openapi({
  example: {
    error: 'Recipe not found',
    details: 'No recipe exists with the provided ID',
  },
});
```

## Development Workflow

### 1. Develop Your API

Continue using your existing `createRequestHandler` pattern:

```typescript
export const myEndpoint = createRequestHandler(
  {
    paramsSchema: myParamsSchema,
    requestBodySchema: myBodySchema,
  },
  async (request, response) => {
    // Your implementation
  },
);
```

### 2. Add OpenAPI Metadata

Enhance your schemas with `.openapi()` calls to add examples and descriptions.

### 3. Register the Endpoint

Add the endpoint to the OpenAPI specification generator.

### 4. Generate Documentation

Run `npm run openapi:generate` to update the specification files.

### 5. Test with Swagger UI

Visit `/api/docs` to test your endpoints interactively.

## Troubleshooting

### Schema Type Errors

If you encounter TypeScript errors with schema types, ensure your schemas are properly typed:

```typescript
// For params/query, use ZodObject explicitly
const paramsSchema = z.object({
  id: z.string().uuid(),
});

// For request body, ZodType is sufficient
const bodySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});
```

### Missing Endpoints

If an endpoint doesn't appear in the generated spec:

1. Ensure it's registered in `src/useCases/openApiSpec.ts`
2. Check that the path matches your router configuration
3. Verify the HTTP method is correct

### File Upload Issues

For file upload endpoints, ensure the `fileUpload` configuration matches your `createRequestHandler` setup:

```typescript
{
  fileUpload: {
    fieldName: 'photoFile',  // Must match multer field name
    required: true,
    acceptedMimeTypes: ['image/*'],
    maxSize: 5 * 1024 * 1024,  // 5MB
  },
}
```

## Contributing

When adding new API endpoints:

1. Follow the existing `createRequestHandler` pattern
2. Add comprehensive Zod schemas with OpenAPI metadata
3. Register the endpoint in the OpenAPI spec generator
4. Add tests for the new functionality
5. Update this documentation if needed

## Dependencies

- `@asteasolutions/zod-to-openapi` - Zod to OpenAPI conversion
- `js-yaml` - YAML generation support
- `zod` - Schema validation (already in use)

The implementation is designed to work seamlessly with your existing architecture and requires minimal changes to your current API code.
