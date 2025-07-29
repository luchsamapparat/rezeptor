# Rezeptor AI Coding Instructions

## Architecture Overview

This is a **full-stack React Router v7 application** with server-side rendering, built around a **use case-driven architecture**. The app manages recipes and cookbooks with a clean separation between client/server code within each domain.

### Core Structure Pattern
```
src/useCases/{domain}/
├── client/           # React components, routes
├── server/           # API handlers, business logic  
├── test/             # Integration tests
└── persistence/      # Database tables, repositories
```

## Key Development Patterns

### 1. Request Handler Pattern
Use `createRequestHandler()` for all API endpoints with automatic validation:

```typescript
// In src/useCases/{domain}/server/api/{endpoint}.ts
export const getItems = createRequestHandler(
  { querySchema: z.object({ limit: z.number() }) },
  async (request, response) => {
    // request.query is now typed and validated
  }
);
```

### 2. Context-Based Dependency Injection
Each use case has its own context store using AsyncLocalStorage:

```typescript
// In {domain}Context.ts
export const {domain}Context = createRequestContextStore<{Domain}Context>('{Domain}Context');

// In API router
app.use({domain}Context.middleware(() => ({
  {domain}Repository: new {Domain}Repository(getApplicationContext().database),
})));
```

### 3. DatabaseRepository Pattern
Extend the base `DatabaseRepository<TTable>` class - it provides CRUD operations with UUID generation:

```typescript
export class CookbookRepository extends DatabaseRepository<typeof cookbooksTable> {
  constructor(database: Database<{ cookbooksTable: typeof cookbooksTable }>) {
    super(database, cookbooksTable);
  }
}
```

### 4. Database Schema with Zod Integration
Tables use Drizzle ORM with automatic Zod schema generation:

```typescript
export const itemsTable = sqliteTable('items', {
  id: primaryKey(),
  title: text().notNull(),
});

export const insertItemSchema = createInsertSchema(itemsTable).omit({ id: true });
```

## Essential Commands

### Development Workflow
- `npm run typecheck` - Run TypeScript type checks
- `npm run lint` - Run ESLint checks
- `npm run dev` - Start dev server with HMR at http://localhost:5173
- `npm run db:generate` - Generate migrations from schema changes
- `npm run db:migrate` - Apply database migrations
- `npm run test:integration` - Run integration tests with in-memory SQLite

## File Upload Handling
When adding file uploads, configure in `createRequestHandler()`:
```typescript
{
  fileUpload: {
    fieldName: 'file',
    required: true,
    acceptedMimeTypes: ['image/'],
    maxSize: 5 * 1024 * 1024
  }
}
```

## Testing Conventions

Integration tests use the `test.extend()` pattern with automatic app/database setup:

```typescript
import { describe, it, expect } from '../../../tests/integration.test';

describe('API Tests', () => {
  it('should work', async ({ app, database }) => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
  });
});
```

## Project-Specific Notes

- **No generic middleware** - Use context stores and createRequestHandler for request processing
- **Type-safe routing** - Routes defined in `routes.ts` files with React Router v7 config
- **Automatic UUID generation** - DatabaseRepository base class handles ID creation
- **In-memory testing** - Tests use SQLite `:memory:` databases
- **Native File API** - File uploads converted from Multer to native File instances
- **SSR enabled** - Full server-side rendering with React Router

## Adding New Use Cases

1. Create directory structure: `src/useCases/{domain}/{client,server,test}`
2. Add table schema in `server/persistence/{domain}Table.ts`
3. Create repository extending base DatabaseRepository class
4. Set up context store in `server/{domain}Context.ts`
5. Add API routes using createRequestHandler pattern
6. Register routes in `src/useCases/routes.ts`
7. Write integration tests following the extend pattern
