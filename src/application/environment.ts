import z from 'zod';

const envSchema = z.object({
  DB_CONNECTION_STRING: z.string().min(1),
  DB_MIGRATIONS_PATH: z.string().min(1),
}).transform(({ DB_CONNECTION_STRING, DB_MIGRATIONS_PATH }) => ({
  database: {
    connectionString: DB_CONNECTION_STRING,
    migrationsPath: DB_MIGRATIONS_PATH,
  },
}));

export type Environment = z.infer<typeof envSchema>;

export function initEnvironment(processEnv: NodeJS.ProcessEnv): Environment {
  return envSchema.parse(processEnv);
}
