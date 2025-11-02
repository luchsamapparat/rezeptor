# Rezeptor - AI Coding Instructions

## Architecture Overview

**Rezeptor** is a recipe management system built with React Router v7 + Hono (SSR), Drizzle ORM (SQLite), and integrates Azure AI services for OCR/recipe extraction.

### Tech Stack
- **Frontend/Backend**: React Router v7 with Hono server (`react-router-hono-server`)
- **Database**: SQLite with Drizzle ORM
- **DI System**: `hono-simple-di` for dependency injection throughout API layers
- **External Services**: Azure Document Intelligence (OCR), Azure OpenAI (recipe extraction), Google Books API

## Project Structure

```
src/
├── index.ts                             # Server entry point (Hono + React Router integration)
├── bootstrap/                           # Application bootstrapping (API server, DI setup)
├── application/                         # Cross-cutting concerns (DI, environment, error handling)
├── common/                              # Shared domain logic (repositories, file operations)
├── useCases/                            # Feature modules (recipes, cookbooks)
│   └── recipes/
│       ├── recipeManagement.ts          # Pure business logic functions
│       ├── cookbookManagement.ts        # Pure business logic functions
│       ├── infrastructure/              # External service adapters, persistence
│       │   ├── di.ts                    # Use-case specific dependencies
│       │   └── persistence/             # Database repositories
│       └── presentation/
│           ├── api/                     # Hono API routes
│           └── ui/                      # React Router routes & components
└── tests/                               # Test utilities and integration test setup
```

## Critical Patterns

### 1. Dependency Injection (DI)
All dependencies are resolved via `hono-simple-di`. **Never instantiate services directly in API routes.**

```typescript
// Define dependencies in infrastructure/di.ts
export const recipeRepository = dependency(
  async (_, c) => new RecipeDatabaseRepository(await database<RecipesDatabaseSchema>().resolve(c)),
  'request'
);

// Use in API routes via middleware
export const recipeApi = new Hono()
  .use(recipeRepository.middleware('recipesRepository'))
  .get('/', async c => c.json(await getRecipes(c.var)));
```

Core dependencies defined in `application/server/di.ts`:
- `environment` - Validated environment config (Zod schema in `environment.ts`)
- `database` - Database connection with schema
- `fileSystem` - Abstracted file operations (`NodeFileSystem` or `FileSystemMock`)
- `fileRepositoryFactory` - Creates file repositories for different upload types

### 2. Pure Business Logic
Functions in `recipeManagement.ts` and `cookbookManagement.ts` are pure - they accept dependencies as parameters and return results. No direct DI resolution.

```typescript
// Business logic receives dependencies as args
export const addRecipe = async ({ recipesRepository, recipe }: AddRecipeArgs) =>
  recipesRepository.insert(recipe);

// API routes resolve dependencies and call business logic
.post('/', validator('json', addRecipeDtoSchema), async c =>
  c.json(await addRecipe({ ...c.var, recipe: c.req.valid('json') }), 201)
);
```

### 3. Database Layer
- **Base Repository**: Extend `DatabaseRepository<TTable>` for standard CRUD operations
- **UUIDs**: Generated via `crypto.randomUUID()` in base `insert()`/`insertMany()` methods
- **Schema**: Define in `infrastructure/persistence/*Table.ts`, aggregate in `recipeDatabaseModel.ts`
- **Migrations**: Drizzle Kit generates from `bootstrap/databaseSchema.ts`

### 4. Error Handling
Custom error types map to HTTP status codes in `bootstrap/apiServer.ts`:
- `NotFoundError` → 404
- `ValidationError` → 422
- `ExternalServiceError` → 500 (with serialized cause)

### 5. File Management
Files are stored via `FileRepository` (UUID filenames, subdirectories per type):
- `FileRepositoryFactory` creates typed repositories: `factory.createFileRepository('recipePhotos')`
- Path structure: `{FILE_UPLOADS_PATH}/{type}/{uuid}`
- Always remove files when deleting parent entities (see `removeRecipe()`)

### 6. React Router Integration
- Routes defined in `useCases/routes.ts` → aggregated in `src/routes.ts`
- Route modules use typed `Route` from `+types/{ComponentName}`:
  ```typescript
  import type { Route } from './+types/RecipeBrowserController';
  export const loader = async ({ context }: Route.LoaderArgs) => { ... };
  ```
- Type-safe loaders/actions with automatic inference

## Development Workflows

### Environment Setup
1. Copy/create `.env` with required vars (see `environment.ts` schema):
   - `DB_CONNECTION_STRING`, `DB_MIGRATIONS_PATH`, `FILE_UPLOADS_PATH`
   - Azure keys: `AZURE_DOCUMENT_INTELLIGENCE_*`, `AZURE_OPENAI_*`
   - `GOOGLE_API_KEY`, recipe extraction prompts
2. Run `npm run db:migrate` to apply Drizzle migrations

### Commands
```bash
npm run dev              # Development server (port 3000)
npm run build            # Production build
npm start                # Run production build
npm run db:generate      # Generate migrations from schema
npm run db:migrate       # Apply migrations
npm test                 # Run tests (Vitest)
npm run typecheck        # TypeScript + React Router type generation
```

### Integration Testing
Use the extended `test` from `tests/integrationTest.ts`:
```typescript
import { it } from '../../../tests/integrationTest';

it('should create a recipe', async ({ app, database, fileSystemMock }) => {
  // app: Hono instance with full middleware
  // database: In-memory SQLite
  // fileSystemMock: Mock file system operations
  const response = await app.request(new Request('http://localhost/api/recipes', {
    method: 'POST',
    body: JSON.stringify({ title: 'Test', content: 'Test' }),
  }));
  expect(response.status).toBe(201);
});
```

Tests use `:memory:` database and mocked Azure/Google services.

### Adding a New Use Case
1. Create `useCases/{feature}/{feature}.ts` with pure functions
2. Add `infrastructure/di.ts` for service dependencies
3. Define database schema in `infrastructure/persistence/*Table.ts`
4. Create API routes in `presentation/api/server.ts`
5. Add React routes in `presentation/ui/{feature}Routes.ts`
6. Aggregate schema in `useCases/index.ts` → `bootstrap/databaseSchema.ts`
7. Generate migration: `npm run db:generate`

## Conventions

- **Path Aliases**: Use absolute imports via `tsconfig.json` paths (e.g., `import { ... } from '../../common/...'`)
- **Validation**: Zod schemas for DTOs, use `validator()` helper from `common/server/validation.ts`
- **File Naming**: `{Feature}Controller.tsx` for route modules, `{Feature}Api.ts` for API routes
- **Database Tables**: `{entity}sTable` (plural) in Drizzle schema files
- **Mock Data**: Use Fishery factories in `test/data/*MockData.ts` for test fixtures

## Deployment

Multi-stage Dockerfile builds production image:
1. Install all deps → build → install prod deps only
2. Copies `database/` for migrations (apply via startup script/init container)
3. Kubernetes deployment via Kustomize (`deployment/kustomize/`)

## Key Files Reference

- `src/bootstrap/apiServer.ts` - Global error handling, DI middleware setup
- `src/application/server/di.ts` - Core dependency definitions
- `src/tests/integrationTest.ts` - Test fixtures and setup
- `vite.config.ts` - React Router + Hono server plugin config
- `drizzle.config.ts` - Database connection & migration settings
