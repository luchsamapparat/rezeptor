# Repository guidance

Rezeptor is a recipe management application. React Router 7 renders the UI through a Hono server; Hono also serves the API. Prisma uses PostgreSQL in production. The recipes use case integrates Azure Document Intelligence, Azure OpenAI, and Google Books.

## Where to work

- `src/index.ts` starts the Hono and React Router server. `src/bootstrap/` assembles the API. `src/application/` holds application-wide configuration, dependency injection, logging, and shared UI.
- `src/useCases/recipes/` contains recipe and cookbook use cases, their infrastructure adapters, API routes, UI routes, and tests. Keep new feature behavior in the relevant use case rather than moving it into route handlers.
- `src/common/` contains shared persistence and server utilities. `src/routes.ts` aggregates route definitions from `src/useCases/routes.ts`.
- `database/schema.prisma` and `database/migrations/` are the Prisma schema and migrations. `deployment/` holds the Docker and Kubernetes configuration.

## Implementation conventions

- Follow the existing TypeScript and ESLint style in nearby files. Use the `@rezeptor/ui/*` alias for shared UI code; use relative imports for other modules, as the codebase does.
- Keep API routes focused on validation, dependency injection, and HTTP responses. Use the Zod-based `validator()` helper in `src/common/server/validation.ts` for request input. Put application operations in `recipeManagement.ts` or `cookbookManagement.ts`; pass repositories and services as arguments instead of resolving DI inside those functions.
- Register infrastructure dependencies in the relevant `infrastructure/di.ts` and attach their middleware to Hono routes. Shared dependencies are defined in `src/application/server/di.ts`. Repository classes use the Prisma client from `src/common/persistence/database.ts`.
- Follow the existing file repository abstraction for uploads. Recipe source files and recipe photos use separate repositories. Preserve associated-file cleanup when changing recipe deletion or upload flows.
- Use the existing Pino logger hierarchy and structured fields. Prefer OpenTelemetry semantic-convention keys where applicable and `rezeptor.*` for domain fields. Do not log credentials, tokens, or personal data. See `src/application/server/logging.ts` and `src/useCases/recipes/infrastructure/di.ts` for the current setup.
- Place shared UI primitives in `src/application/ui/components/ui/`. The UI uses Tailwind CSS 4 and shadcn components configured by `components.json`; use the existing CSS variables and `cn()` helper when styling them.
- When changing API errors, check `src/application/server/errorHandling.ts`: not-found errors return 404, validation errors 422, and external-service errors 500 with a serialized cause. When changing configuration, use the Zod schema in `src/application/server/environment.ts` as the source of truth for environment variable names.

## Validation and local commands

- `npm run dev` starts the development server on port 3000. `npm run build` creates the production build; `npm start` runs it.
- `npm run lint` checks ESLint rules. `npm run typecheck` generates React Router types and runs the TypeScript project build.
- `npm test` runs Vitest once. The test setup uses Prisma with an in-memory PGlite database, applies a generated schema, clears tables between tests, and mocks external services. Use the fixture in `src/tests/integrationTest.ts` for API integration tests and keep feature fixtures under the corresponding `test/` directory.
- After a Prisma schema change, run `npm run db:generate`; use `npm run db:dev` to create and apply development migrations. Review generated migrations before including them.
- Run the checks relevant to the files changed and report any check you could not run. Tests may generate the ignored `database/migration.sql` file.
