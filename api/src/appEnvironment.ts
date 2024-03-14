import { createContainer } from "iti";
import { z } from "zod";
import { createAzureDocumentAnalysisApiClient } from "./infrastructure/api/azureDocumentIntelligence";
import { createbooksApi } from "./infrastructure/api/googleBooks";
import { createCosmosDbClient, createOrGetDatabase, createOrGetDatabaseContainer } from "./infrastructure/persistence/azureCosmosDb";
import { createBlobContainerClient, createBlobServiceClient } from "./infrastructure/persistence/azureStorageAccount";

const environmentSchema = z.object({
    GOOGLE_API_KEY: z.string(),
    AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: z.string().url(),
    AZURE_DOCUMENT_INTELLIGENCE_KEY: z.string(),
    AZURE_STORAGE_ACCOUNT_NAME: z.string(),
    AZURE_STORAGE_ACCOUNT_KEY: z.string(),
    AZURE_STORAGE_BLOB_ENDPOINT: z.string().url(),
    AZURE_COSMOSDB_ENDPOINT: z.string().url(),
    AZURE_COSMOSDB_KEY: z.string(),
});

type EnvironmentVars = z.infer<typeof environmentSchema>;

const createAppEnvironment = (processEnv: NodeJS.ProcessEnv) => {
    const env: EnvironmentVars = environmentSchema.parse(processEnv);

    const container = createContainer()
        .add({
            blobService: () => createBlobServiceClient(
                env.AZURE_STORAGE_BLOB_ENDPOINT,
                env.AZURE_STORAGE_ACCOUNT_NAME,
                env.AZURE_STORAGE_ACCOUNT_KEY
            )
        })
        .add(ctx => ({
            photoBlobContainer: () => createBlobContainerClient(ctx.blobService, 'photo'),
            recipeBlobContainer: () => createBlobContainerClient(ctx.blobService, 'recipe'),
        }))
        .add({
            dbClient: () => createCosmosDbClient(
                env.AZURE_COSMOSDB_ENDPOINT,
                env.AZURE_COSMOSDB_KEY,
            )
        })
        .add(ctx => ({
            database: async () => createOrGetDatabase(ctx.dbClient, 'rezeptor')
        }))
        .add(ctx => ({
            cookbookContainer: async () => createOrGetDatabaseContainer(await ctx.database, 'cookbook'),
            recipeContainer: async () => createOrGetDatabaseContainer(await ctx.database, 'recipe'),
        }))
        .add({
            booksApi: () => createbooksApi(
                env.GOOGLE_API_KEY
            ),
            documentAnalysisApi: () => createAzureDocumentAnalysisApiClient(
                env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
                env.AZURE_DOCUMENT_INTELLIGENCE_KEY
            )
        });


    return container;
}

export const appEnvironment = createAppEnvironment(process.env);