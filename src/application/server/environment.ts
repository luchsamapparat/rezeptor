import z from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'silent']).default('info'),
  OTEL_SERVICE_NAME: z.string().min(1).optional(),
  OTEL_SERVICE_VERSION: z.string().min(1).optional(),
  DB_CONNECTION_STRING: z.string().min(1),
  DB_MIGRATIONS_PATH: z.string().min(1),
  FILE_UPLOADS_PATH: z.string().min(1),
  RECIPE_EXTRACTION_SYSTEM_PROMPT: z.string(),
  RECIPE_EXTRACTION_USER_PROMPT: z.string(),
  AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: z.url(),
  AZURE_DOCUMENT_INTELLIGENCE_KEY: z.string(),
  AZURE_OPENAI_ENDPOINT: z.url(),
  AZURE_OPENAI_KEY: z.string(),
  AZURE_OPENAI_MODEL: z.string(),
  AZURE_OPENAI_DEPLOYMENT: z.string(),
  GOOGLE_API_KEY: z.string(),
}).transform(({
  NODE_ENV,
  LOG_LEVEL,
  OTEL_SERVICE_NAME,
  OTEL_SERVICE_VERSION,
  DB_CONNECTION_STRING,
  DB_MIGRATIONS_PATH,
  FILE_UPLOADS_PATH,
  RECIPE_EXTRACTION_SYSTEM_PROMPT,
  RECIPE_EXTRACTION_USER_PROMPT,
  AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
  AZURE_DOCUMENT_INTELLIGENCE_KEY,
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_KEY,
  AZURE_OPENAI_MODEL,
  AZURE_OPENAI_DEPLOYMENT,
  GOOGLE_API_KEY,
}) => ({
  nodeEnv: NODE_ENV,
  logging: {
    level: LOG_LEVEL,
  },
  openTelemetry: {
    serviceName: OTEL_SERVICE_NAME,
    serviceVersion: OTEL_SERVICE_VERSION,
  },
  database: {
    connectionString: DB_CONNECTION_STRING,
    migrationsPath: DB_MIGRATIONS_PATH,
  },
  azureDocumentAnalysis: {
    endpoint: AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
    key: AZURE_DOCUMENT_INTELLIGENCE_KEY,
  },
  azureOpenAI: {
    endpoint: AZURE_OPENAI_ENDPOINT,
    key: AZURE_OPENAI_KEY,
    model: AZURE_OPENAI_MODEL,
    deployment: AZURE_OPENAI_DEPLOYMENT,
  },
  googleBooks: {
    key: GOOGLE_API_KEY,
  },
  fileUploadsPath: FILE_UPLOADS_PATH,
  recipeExtraction: {
    systemPrompt: RECIPE_EXTRACTION_SYSTEM_PROMPT,
    userPrompt: RECIPE_EXTRACTION_USER_PROMPT,
  },
}));

export type Environment = z.infer<typeof envSchema>;

export function initEnvironment(processEnv: NodeJS.ProcessEnv): Environment {
  return envSchema.parse(processEnv);
}
