import z from 'zod';

const envSchema = z.object({
  DB_CONNECTION_STRING: z.string().min(1),
  DB_MIGRATIONS_PATH: z.string().min(1),
  FILE_UPLOADS_PATH: z.string().min(1),
  AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: z.url(),
  AZURE_DOCUMENT_INTELLIGENCE_KEY: z.string(),
  GOOGLE_API_KEY: z.string(),
}).transform(({ DB_CONNECTION_STRING, DB_MIGRATIONS_PATH, FILE_UPLOADS_PATH, AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT, AZURE_DOCUMENT_INTELLIGENCE_KEY, GOOGLE_API_KEY }) => ({
  database: {
    connectionString: DB_CONNECTION_STRING,
    migrationsPath: DB_MIGRATIONS_PATH,
  },
  documentAnalysis: {
    endpoint: AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
    key: AZURE_DOCUMENT_INTELLIGENCE_KEY,
  },
  bookSearch: {
    key: GOOGLE_API_KEY,
  },
  fileUploadsPath: FILE_UPLOADS_PATH,
}));

export type Environment = z.infer<typeof envSchema>;

export function initEnvironment(processEnv: NodeJS.ProcessEnv): Environment {
  return envSchema.parse(processEnv);
}
