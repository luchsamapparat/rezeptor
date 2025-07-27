import { z } from 'zod/v4-mini';

const envSchema = z.pipe(
  z.object({
    DB_CONNECTION_STRING: z.string().check(
      z.minLength(1),
    ),
    DB_MIGRATIONS_PATH: z.string().check(
      z.minLength(1),
    ),
  }),
  z.transform(({ DB_CONNECTION_STRING, DB_MIGRATIONS_PATH }) => ({
    database: {
      connectionString: DB_CONNECTION_STRING,
      migrationsPath: DB_MIGRATIONS_PATH,
    },
  })),
);

export type Environment = z.infer<typeof envSchema>;

export function initEnvironment(processEnv: NodeJS.ProcessEnv): Environment {
  return envSchema.parse(processEnv);
}
