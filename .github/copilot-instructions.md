# Rezeptor Project - AI Agent Instructions

## Architecture Overview

**Rezeptor** is a recipe management application built with React Router v7 + Hono backend using a Clean Architecture approach organized around **Use Cases**. The project follows Domain-Driven Design patterns with clear separation between client/server layers.

### Core Stack
- **Frontend**: React Router v7 with React Query for state management
- **Backend**: Hono web framework with dependency injection (`hono-simple-di`)
- **Database**: SQLite with Drizzle ORM + migrations
- **AI Services**: Azure Document Intelligence + Google Books API
- **Testing**: Vitest with separate unit/integration test configs

### Project Structure
```
src/
├── useCases/           # Domain boundaries (cookbookManagement, recipeManagement, recipeBrowser)
├── application/        # Cross-cutting concerns (DI, environment, external clients)
├── common/            # Shared infrastructure (database, file system, validation)
└── bootstrap/         # Application composition and API server setup
```

## Key Development Patterns

### Use Case Organization
Each domain follows this structure:
```
useCases/[domain]/
├── client/            # React components, API clients, routes
├── server/            # API routes, business logic, persistence
└── test/              # Integration tests, mocks, test data
```

### Dependency Injection Pattern
Use the `dependency()` helper for injecting services into Hono middleware:
```typescript
const repository = dependency(async (_, c) => 
  new MyRepository(await database<Schema>().resolve(c)), 'request');
```

### API Route Structure
APIs follow RESTful patterns with proper validation:
```typescript
.post('/', validator('json', dtoSchema), async c => 
  c.json(await useCase({ ...c.var, data: c.req.valid('json') }), 201))
```

### Repository Pattern
All persistence extends `DatabaseRepository<TTable>` with auto-generated UUIDs:
```typescript
export class MyRepository extends DatabaseRepository<typeof myTable> {
  constructor(database: Database<{ myTable: typeof myTable }>) {
    super(database, myTable);
  }
}
```

## Development Workflows

### Environment Setup
Required environment variables (see `src/application/server/environment.ts`):
```bash
DB_CONNECTION_STRING=file:./data/database.sqlite
DB_MIGRATIONS_PATH=./database
FILE_UPLOADS_PATH=./data/uploads
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://...
AZURE_DOCUMENT_INTELLIGENCE_KEY=...
GOOGLE_API_KEY=...
```

### Development Commands
- `npm run dev` - Start development server (port 3000)
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run database migrations
- `npm run test` - Unit tests only
- `npm run test:integration` - Integration tests (use for API testing)
- `npm run typecheck` - Full TypeScript + React Router type generation

### Testing Strategy
- **Unit tests**: `*.test.ts` - Pure business logic, utilities
- **Integration tests**: `*.integration.test.ts` - Full API testing with in-memory database
- **Test setup**: Use `beforeEach, it` from `src/tests/integration.test.ts` for API tests
- **Mocking**: External services mocked via Vitest (`vi.mock()`) - see `src/tests/mocks/`

### File Upload Handling
Files are managed through `FileRepository` + `FileRepositoryFactory`:
```typescript
const fileRepo = factory.createFileRepository('recipes'); // Creates /uploads/recipes/
const fileId = await fileRepo.save(buffer); // Returns UUID filename
await fileRepo.remove(fileId); // Handles missing files gracefully
```

## API Client Patterns

### Hono Client Generation
Type-safe API clients using Hono's RPC:
```typescript
const client = hc<typeof apiType>('/api');
const response = await client.endpoint.$get();
```

### React Query Integration
```typescript
export const myQuery = () => ({
  queryKey: ['resource'],
  queryFn: async () => (await apiClient.resource.$get()).json(),
});
```

## Error Handling & Validation

- **Validation**: Zod schemas with `validator()` middleware
- **Business Errors**: `NotFoundError` (404), `ValidationError` (422)
- **File Validation**: Use `.refine()` for file type checking
- **Error Responses**: Consistent `{ error: string }` format

## External Integrations

- **Azure Document Intelligence**: OCR for recipe/cookbook extraction
- **Google Books API**: Cookbook identification by ISBN/EAN-13
- **File Processing**: Sharp for image handling, automated file cleanup on entity deletion

## Testing Anti-Patterns to Avoid

- Don't mock business logic - use integration tests instead
- External API calls must be mocked (`setupAzureFormRecognizerMock`, `setupGoogleBooksMock`)
- Use `FileSystemMock` for file operations testing
- Always test both success and error scenarios (404, 422 responses)
