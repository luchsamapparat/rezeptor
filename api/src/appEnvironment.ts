import { createContainer } from "iti";
import { z } from "zod";
import { ChallengeRepository } from "./auth/infrastructure/persistence/ChallengeRepository";
import { GroupRepository } from "./auth/infrastructure/persistence/GroupRepository";
import { SessionRepository } from "./auth/infrastructure/persistence/SessionRepository";
import { AuthenticationConfig } from "./auth/model";
import { setupApplicationInsights } from "./common/infrastructure/azureApplicationInsights";
import { createCosmosDbClient, createNonPartitionedItemContainer, createOrGetDatabase } from "./common/infrastructure/persistence/azureCosmosDb";
import { createBlobServiceClient } from "./common/infrastructure/persistence/azureStorageAccount";
import { createAzureDocumentAnalysisApiClient } from "./recipes/infrastructure/api/azureDocumentIntelligence";
import { createbooksApi } from "./recipes/infrastructure/api/googleBooks";

const environmentSchema = z.object({
    GOOGLE_API_KEY: z.string(),
    APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),
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
    AUTH_COOKIE_SECRET: z.string(),
    AUTH_COOKIE_DOMAIN: z.string(),
});

type EnvironmentVars = z.infer<typeof environmentSchema>;

const createAppEnvironment = (processEnv: NodeJS.ProcessEnv) => {
    const env: EnvironmentVars = environmentSchema.parse(processEnv);

    const appContainer = createContainer()
        .add({
            telemetry: () => setupApplicationInsights(env.APPLICATIONINSIGHTS_CONNECTION_STRING),
            blobService: () => createBlobServiceClient(
                env.AZURE_STORAGE_BLOB_ENDPOINT,
                env.AZURE_STORAGE_ACCOUNT_NAME,
                env.AZURE_STORAGE_ACCOUNT_KEY
            ),
            dbClient: () => createCosmosDbClient(
                env.AZURE_COSMOSDB_ENDPOINT,
                env.AZURE_COSMOSDB_KEY,
            ),
            booksApi: () => createbooksApi(
                env.GOOGLE_API_KEY
            ),
            documentAnalysisApi: () => createAzureDocumentAnalysisApiClient(
                env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
                env.AZURE_DOCUMENT_INTELLIGENCE_KEY
            )
        })
        .add(ctx => ({
            database: async () => createOrGetDatabase(ctx.dbClient, 'rezeptor')
        }))
        .add({
            authenticationConfig: (): AuthenticationConfig => ({
                rpName: env.AUTH_RP_NAME,
                rpId: env.AUTH_RP_ID,
                allowedOrigin: env.AUTH_ALLOWED_ORIGIN,
                challengeTtl: env.AUTH_CHALLENGE_TTL,
                sessionTtl: env.AUTH_SESSION_TTL,
                cookieSecret: env.AUTH_COOKIE_SECRET,
                cookieDomain: env.AUTH_COOKIE_DOMAIN
            })
        })
        .add(ctx => ({
            groupRepository: async () => new GroupRepository(
                await createNonPartitionedItemContainer(
                    await ctx.database,
                    'group',
                    ctx.telemetry
                )
            ),
            sessionRepository: async () => new SessionRepository(
                await createNonPartitionedItemContainer(
                    await ctx.database,
                    'session',
                    ctx.telemetry,
                    { defaultTtl: ctx.authenticationConfig.sessionTtl }
                )

            ),
            challengeRepository: async () => new ChallengeRepository(
                await createNonPartitionedItemContainer(
                    await ctx.database,
                    'challenge',
                    ctx.telemetry,
                    { defaultTtl: ctx.authenticationConfig.challengeTtl }
                )
            ),
        }));

    return appContainer;
}

export const appEnvironment = createAppEnvironment(process.env);

export type AppEnvironment = typeof appEnvironment;
