# Rezeptor - AI Coding Instructions

## Architecture Overview

**Rezeptor** is a recipe management system built with React Router v7 + Hono (SSR), Prisma ORM (Postgres), and integrates Azure AI services for OCR/recipe extraction.

### Tech Stack
- **Frontend/Backend**: React Router v7 with Hono server (`react-router-hono-server`)
- **Database**: Postgres with Prisma ORM
- **DI System**: `hono-simple-di` for dependency injection throughout API layers
- **Logging**: `pino` with OpenTelemetry integration (`@opentelemetry/instrumentation-pino`)
- **UI Components**: Shadcn UI (New York style) with Tailwind CSS v4
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
  .use(recipeRepository.middleware('recipeRepository'))
  .get('/', async c => c.json(await getRecipes(c.var)));
```

Core dependencies defined in `application/server/di.ts`:
- `environment` - Validated environment config (Zod schema in `environment.ts`)
- `logger` - Root pino logger instance (injected into context)
- `database` - Database connection with schema
- `fileSystem` - Abstracted file operations (`NodeFileSystem` or `FileSystemMock`)
- `fileRepositoryFactory` - Creates file repositories for different upload types

### 2. Pure Business Logic
Functions in `recipeManagement.ts` and `cookbookManagement.ts` are pure - they accept dependencies as parameters and return results. No direct DI resolution.

```typescript
// Business logic receives dependencies as args
export const addRecipe = async ({ recipeRepository, recipe }: AddRecipeArgs) =>
  recipeRepository.insert(recipe);

// API routes resolve dependencies and call business logic
.post('/', validator('json', addRecipeDtoSchema), async c =>
  c.json(await addRecipe({ ...c.var, recipe: c.req.valid('json') }), 201)
);
```

### 3. Database Layer
- **ORM**: Prisma ORM with PostgreSQL
- **Client**: Use `PrismaClient` as the `DatabaseClient` type (see `src/common/persistence/database.ts`)
- **Repositories**: Implement repository classes using Prisma client methods (see `RecipeDatabaseRepository.ts`, `CookbookDatabaseRepository.ts`)
- **Schema**: Define in `database/schema.prisma`, configure via `prisma.config.ts`
- **Migrations**: Managed by Prisma CLI (`npm run db:*`)

### 4. Error Handling
Custom error types map to HTTP status codes in `bootstrap/apiServer.ts`:
- `NotFoundError` → 404
- `ValidationError` → 422
- `ExternalServiceError` → 500 (with serialized cause)

### 5. Logging
**Structured logging with `pino` and OpenTelemetry integration** (see `docs/LOGGING.md` for details):

- **Root Logger**: Created in `application/server/logging.ts`, injected via DI
- **Use Case Logger**: Child of root logger with `useCase` field (defined in use case `di.ts`)
- **Component Logger**: Child of use case logger with `component` field (created in class constructors)

```typescript
// In use case di.ts
export const useCaseLogger = dependency(async (_, c): Promise<Logger | null> => {
  const rootLogger = await logger.resolve(c);
  return rootLogger?.child({ useCase: 'recipes' }) ?? null;
}, 'request');

// In repository/service constructor
constructor(database: Database, logger: Logger | null = null) {
  this.log = logger?.child({ component: this.constructor.name }) ?? noopLogger;
}

// Usage with OpenTelemetry semantic conventions
import { ATTR_DB_COLLECTION_NAME } from '@opentelemetry/semantic-conventions/incubating';

this.log.info({
  [ATTR_DB_COLLECTION_NAME]: 'recipes',
  'rezeptor.recipe.id': recipeId,
  'rezeptor.recipe.title': title,
}, 'Recipe created successfully');

this.log.error({
  err,
  'file.name': fileName,
}, 'Failed to process image');
```

**Logging Guidelines**:
- **Always use OpenTelemetry semantic convention constants** from `@opentelemetry/semantic-conventions/incubating`
- Import constants at the top: `import { ATTR_HTTP_ROUTE, ATTR_DB_COLLECTION_NAME } from '@opentelemetry/semantic-conventions/incubating';`
- Use constants as keys in log objects: `{ [ATTR_HTTP_ROUTE]: '/api/recipes' }`
- Namespace domain-specific fields under `rezeptor.*` (e.g., `rezeptor.recipe.id`, `rezeptor.cookbook.title`)
- Use appropriate log levels: `info` for business events, `debug` for details, `error` for failures
- Include contextual fields using semantic conventions first, then domain-specific fields
- Never log sensitive data (passwords, tokens, PII)
- Request/response logging only at `trace` level (controlled by `LOG_LEVEL` env var)
- Stack traces only in development mode

**Common Semantic Convention Constants**:
- HTTP: `ATTR_HTTP_REQUEST_METHOD`, `ATTR_HTTP_ROUTE`, `ATTR_HTTP_RESPONSE_STATUS_CODE`
- Network: `ATTR_NETWORK_PEER_PORT`, `ATTR_URL_FULL`
- Database: `ATTR_DB_COLLECTION_NAME`, `ATTR_DB_OPERATION_NAME`, `ATTR_DB_OPERATION_BATCH_SIZE`
- Files: `ATTR_FILE_NAME`, `ATTR_FILE_SIZE`, `ATTR_FILE_PATH`
- Errors: `ATTR_EXCEPTION_TYPE`, `ATTR_EXCEPTION_MESSAGE`, `ATTR_EXCEPTION_STACKTRACE`
- AI: `ATTR_GEN_AI_RESPONSE_MODEL`

### 6. File Management
Files are stored via `FileRepository` (UUID filenames, subdirectories per type):
- `FileRepositoryFactory` creates typed repositories: `factory.createFileRepository('recipePhotos')`
- Path structure: `{FILE_UPLOADS_PATH}/{type}/{uuid}`
- Always remove files when deleting parent entities (see `removeRecipe()`)

### 7. React Router Integration
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
  - `POSTGRES_*`, `FILE_UPLOADS_PATH`
  - Azure keys: `AZURE_DOCUMENT_INTELLIGENCE_*`, `AZURE_OPENAI_*`
  - `GOOGLE_API_KEY`, recipe extraction prompts
2. Run `npm run db:dev` to apply Prisma migrations (or `npm run db:generate` to generate Prisma client)

### Commands
```bash
```bash
npm run dev              # Development server (port 3000)
npm run build            # Production build
npm start                # Run production build
npm run db:generate      # Generate Prisma client from schema
npm run db:dev           # Apply Prisma migrations (development)
npm test                 # Run tests (Vitest)
npm run typecheck        # TypeScript + React Router type generation
```

### Integration Testing
Use the extended `test` from `tests/integrationTest.ts`:
```typescript
import { it } from '../../../tests/integrationTest';

it('should create a recipe', async ({ app, database, fileSystemMock }) => {
  // app: Hono instance with full middleware
  // database: Prisma instance
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
3. Define database schema in `database/schema.prisma`
4. Create repository in `infrastructure/persistence/{feature}DatabaseRepository.ts` using Prisma client
5. Create API routes in `presentation/api/server.ts`
6. Add React routes in `presentation/ui/{feature}Routes.ts`
7. Run `npm run db:generate` to update Prisma client after schema changes
8. Run `npm run db:dev` to apply migrations

## UI Components with Shadcn

### Setup
Shadcn UI is configured with:
- **Style**: New York variant
- **Styling**: Tailwind CSS v4 with CSS variables
- **Icons**: Lucide React
- **Base Color**: Neutral
- **Location**: `src/application/ui/components/ui/`

### Adding Components
Use the Shadcn CLI to add new components:
```bash
npx shadcn@latest add <component-name>
```

Examples:
```bash
npx shadcn@latest add button       # Add Button component
npx shadcn@latest add dialog       # Add Dialog component
npx shadcn@latest add form         # Add Form component
```

Components are automatically installed to `src/application/ui/components/ui/` based on the path aliases in `components.json`.

**After adding components, run the linter to fix any formatting issues:**
```bash
npm run lint -- --fix
```

### Using Components
Import components using the configured path aliases:
```typescript
import { Button } from '@rezeptor/ui/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@rezeptor/ui/components/ui/Card';
import { Input } from '@rezeptor/ui/components/ui/Input';
```

### Customizing Components
- **Modify Existing**: Edit component files in `src/application/ui/components/ui/`
- **Styling**: Use Tailwind CSS classes and CSS variables defined in `src/application/ui/stylesheet.css`
- **Variants**: Use `class-variance-authority` for component variants (already configured in base components)
- **Utils**: Use `cn()` utility from `@rezeptor/ui/lib/utils` for conditional class merging

### Available Path Aliases
Defined in `components.json` and `tsconfig.json`:
- `@rezeptor/ui/components` → `src/application/ui/components`
- `@rezeptor/ui/components/ui` → `src/application/ui/components/ui`
- `@rezeptor/ui/lib/utils` → `src/application/ui/lib/utils`
- `@rezeptor/ui/hooks` → `src/hooks`

## Conventions

- **Path Aliases**: Use absolute imports via `tsconfig.json` paths (e.g., `import { ... } from '../../common/...'`)
- **Validation**: Zod schemas for DTOs, use `validator()` helper from `common/server/validation.ts`
- **File Naming**: `{Feature}Controller.tsx` for route modules, `{Feature}Api.ts` for API routes
- **Database Tables**: Define in `database/schema.prisma` (Prisma models)
- **Mock Data**: Use Fishery factories in `test/data/*MockData.ts` for test fixtures
- **UI Components**: Use Shadcn components from `@rezeptor/ui/components/ui/*` for consistent styling

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
- `src/common/persistence/database.ts` - Prisma client integration and factory
- `prisma.config.ts` - Prisma CLI configuration
- `database/schema.prisma` - Database schema (Prisma)
