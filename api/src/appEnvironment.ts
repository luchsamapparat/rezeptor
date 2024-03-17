import { createContainer } from "iti";
import { z } from "zod";
import { AuthenticationConfig } from "./auth/model";
import { createCosmosDbClient, createOrGetDatabase, createOrGetDatabaseContainer } from "./common/infrastructure/persistence/azureCosmosDb";
import { createBlobContainerClient, createBlobServiceClient } from "./common/infrastructure/persistence/azureStorageAccount";
import { createAzureDocumentAnalysisApiClient } from "./recipes/infrastructure/api/azureDocumentIntelligence";
import { createbooksApi } from "./recipes/infrastructure/api/googleBooks";

const environmentSchema = z.object({
    GOOGLE_API_KEY: z.string(),
    AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: z.string().url(),
    AZURE_DOCUMENT_INTELLIGENCE_KEY: z.string(),
    AZURE_STORAGE_ACCOUNT_NAME: z.string(),
    AZURE_STORAGE_ACCOUNT_KEY: z.string(),
    AZURE_STORAGE_BLOB_ENDPOINT: z.string().url(),
    AZURE_COSMOSDB_ENDPOINT: z.string().url(),
    AZURE_COSMOSDB_KEY: z.string(),
    AUTH_RP_NAME: z.string(),
    AUTH_RP_ID: z.string(),
    AUTH_ALLOWED_ORIGIN: z.string().url(),
    AUTH_CHALLENGE_TTL: z.string().regex(/^\d+$/).transform(value => parseInt(value, 10)),
    AUTH_SESSION_TTL: z.string().regex(/^\d+$/).transform(value => parseInt(value, 10)),
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
            authenticationConfig: (): AuthenticationConfig => ({
                rpName: env.AUTH_RP_NAME,
                rpId: env.AUTH_RP_ID,
                allowedOrigin: env.AUTH_ALLOWED_ORIGIN,
                challengeTtl: env.AUTH_CHALLENGE_TTL,
                sessionTtl: env.AUTH_SESSION_TTL
            })
        })
        .add(ctx => ({
            groupContainer: async () => createOrGetDatabaseContainer(await ctx.database, 'group'),
            challengeContainer: async () => createOrGetDatabaseContainer(await ctx.database, 'challenge', {
                defaultTtl: ctx.authenticationConfig.challengeTtl
            }),
            sessionContainer: async () => createOrGetDatabaseContainer(await ctx.database, 'session', {
                defaultTtl: ctx.authenticationConfig.sessionTtl
            }),
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