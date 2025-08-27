import z from 'zod';

const envSchema = z.object({
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
