# Logging Setup

This project uses `pino` for structured logging with OpenTelemetry integration.

## Configuration

Logging is configured via environment variables:

```env
NODE_ENV=development          # development | production | test
LOG_LEVEL=info               # fatal | error | warn | info | debug | trace
OTEL_EXPORTER_OTLP_ENDPOINT= # Optional: URL to OpenTelemetry collector (e.g., http://localhost:4318)
```

## Features

### Development vs Production

- **Development**: Logs are formatted with `hono-pino/debug-log` for human readability
- **Production**: Logs are structured JSON for machine processing

### Log Levels

- `fatal`: System-level failures
- `error`: Application errors (e.g., external service failures, unhandled exceptions)
- `warn`: Warnings (e.g., validation errors, resource not found)
- `info`: Important business events (e.g., recipe created, cookbook added)
- `debug`: Detailed debugging information
- `trace`: Request/response logging (only when `LOG_LEVEL=trace`)

### Structured Fields

Logs prefer OpenTelemetry Semantic Conventions first; domain/business data is namespaced under `rezeptor.*` to avoid collisions and clarify ownership.

Core (automatic / base):
- `service`: Always `rezeptor`
- `environment`: Current `NODE_ENV`
- Trace correlation fields: injected by OpenTelemetry/Pino instrumentation

Semantic (examples used):
- `http.request.method`
- `http.route`
- `http.response.status_code`
- `exception.type` / `exception.message` / `exception.stacktrace`
- `file.name` / `file.size` / `file.path`
- `db.operation.name` / `db.collection.name` / `db.operation.batch.size`
- `db.query.text` / `db.query.parameter.<index>`
- `gen_ai.response.model`

Domain (namespaced):
- `rezeptor.http.duration_ms` (request latency; no direct semantic log attr)
- `rezeptor.recipe.id`, `rezeptor.recipe.title`, `rezeptor.recipe.ingredient_count`
- `rezeptor.book.isbn`, `rezeptor.book.title`, `rezeptor.book.lookup.status`
- `rezeptor.barcode.value`, `rezeptor.barcode.format`
- `rezeptor.ocr.features`
- `rezeptor.error.kind` (`not_found|validation|external|unhandled`)

Numeric suffix conventions:
- Durations: `_ms`
- Counts (flat scalar): `_count` (e.g., `rezeptor.db.batch_count`); hierarchical (`.count`) allowed only where grouping clarity is improved, but avoid mixing styles within same entity
- Sizes: `_bytes`

Avoid duplication: do NOT repeat the same logical value as both semantic attribute and `rezeptor.*` unless adding domain nuance.

## Architecture

### Logging Hierarchy (Option C: Hybrid Approach)

1. **Root Logger**: Created in `src/application/server/logging.ts`
   - Base logger with service-level configuration
   - Injected into DI system

2. **Use Case Logger**: Created in use case `di.ts` files
   - Child of root logger with `useCase` field
   - Example: `{ useCase: 'recipes' }`

3. **Component Logger**: Created in repository/service constructors
   - Child of use case logger with `component` field
   - Example: `{ useCase: 'recipes', component: 'RecipeDatabaseRepository' }`

### Example (Recipe Creation)

```typescript
// In src/useCases/recipes/infrastructure/di.ts
export const useCaseLogger = dependency(async (_, c): Promise<Logger | null> => {
  const rootLogger = await logger.resolve(c);
  return rootLogger?.child({ useCase: 'recipes' }) ?? null;
}, 'request');

export const recipeRepository = dependency(async (_, c) => {
  const db = await database<RecipesDatabaseSchema>().resolve(c);
  const log = await useCaseLogger.resolve(c);
  return new RecipeDatabaseRepository(db, log);
}, 'request');

// In RecipeDatabaseRepository constructor
constructor(database: Database, logger: Logger | null = null) {
  this.log = logger?.child({ component: this.constructor.name }) ?? noopLogger;
}

// Usage in methods (after refactor)
this.log.info({
  'rezeptor.recipe.title': result.data.title,
}, 'Recipe extracted successfully');
```

## OpenTelemetry Integration

The project integrates with OpenTelemetry for distributed tracing:

- **PinoInstrumentation**: Automatically adds trace context to logs
- **OTLP Exporter**: Sends traces to an OpenTelemetry collector when `OTEL_EXPORTER_OTLP_ENDPOINT` is configured
- **Correlation**: Trace IDs from OpenTelemetry are automatically included in logs via `PinoInstrumentation`

### Kubernetes Deployment

When deploying to Kubernetes with an OTel Collector sidecar:

1. Set `OTEL_EXPORTER_OTLP_ENDPOINT` to the collector endpoint (e.g., `http://localhost:4318`)
2. The collector handles batching, retry, and forwarding to your observability backend
3. Logs and traces share correlation IDs for unified debugging

## Request/Response Logging

Enabled only when `LOG_LEVEL=trace`:
- Semantic: `http.request.method`, `http.route`, `http.response.status_code`
- Domain: `rezeptor.http.duration_ms`
- Bodies are not logged (sensitive data protection)

## Error Logging

Errors are logged with appropriate context:

- `NotFoundError`: Logged at `warn` level
- `ValidationError`: Logged at `warn` level
- `ExternalServiceError`: Logged at `error` level with cause
- Unhandled errors: Logged at `error` level with stack trace (development only)

## Best Practices

1. **Log at appropriate levels**: Use `info` for business events, `debug` for detailed info, `error` for failures
2. **Include context**: Add relevant fields (e.g., `recipeId`, `cookbookId`) to help with debugging
3. **Avoid sensitive data**: Never log passwords, tokens, or PII
4. **Use structured fields**: Prefer `{ userId: '123' }` over string interpolation
5. **Child loggers**: Always create child loggers in constructors with `component` field
