import { createContainer } from "iti";
import { z } from "zod";
import { createAzureDocumentAnalysisApiClient } from "./infrastructure/api/azureDocumentIntelligence";
import { createGoogleBooksApiClient } from "./infrastructure/api/googleBooks";
import { createBlobContainerClient, createBlobServiceClient, createTableClient } from "./infrastructure/persistence/azureStorageAccount";

const environmentSchema = z.object({
    GOOGLE_API_KEY: z.string(),
    AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: z.string().url(),
    AZURE_DOCUMENT_INTELLIGENCE_KEY: z.string(),
    AZURE_STORAGE_ACCOUNT_NAME: z.string(),
    AZURE_STORAGE_ACCOUNT_KEY: z.string(),
    AZURE_STORAGE_BLOB_ENDPOINT: z.string().url(),
    AZURE_STORAGE_TABLE_ENDPOINT: z.string().url(),
});

type EnvironmentVars = z.infer<typeof environmentSchema>;

const createAppEnvironment = (processEnv: NodeJS.ProcessEnv) => {
    const env: EnvironmentVars = environmentSchema.parse(processEnv);

    const container = createContainer()
        .add({
            azureStorageBlobServiceClient: () => createBlobServiceClient(
                env.AZURE_STORAGE_BLOB_ENDPOINT,
                env.AZURE_STORAGE_ACCOUNT_NAME,
                env.AZURE_STORAGE_ACCOUNT_KEY
            )
        })
        .add(items => ({
            azureStoragePhotoBlobContainerClient: () => createBlobContainerClient(
                items.azureStorageBlobServiceClient,
                'photo'
            ),
            azureStorageRecipeBlobContainerClient: () => createBlobContainerClient(
                items.azureStorageBlobServiceClient,
                'recipe'
            ),
        }))
        .add({
            azureStorageCookbookTableClient: () => createTableClient(
                env.AZURE_STORAGE_TABLE_ENDPOINT,
                'cookbook',
                env.AZURE_STORAGE_ACCOUNT_NAME,
                env.AZURE_STORAGE_ACCOUNT_KEY
            ),
            azureStorageRecipeTableClient: () => createTableClient(
                env.AZURE_STORAGE_TABLE_ENDPOINT,
                'recipe',
                env.AZURE_STORAGE_ACCOUNT_NAME,
                env.AZURE_STORAGE_ACCOUNT_KEY
            )
        })
        .add({
            googleBooksApiClient: () => createGoogleBooksApiClient(
                env.GOOGLE_API_KEY
            ),
            azureDocumentIntelligenceApiClient: () => createAzureDocumentAnalysisApiClient(
                env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
                env.AZURE_DOCUMENT_INTELLIGENCE_KEY
            )
        });


    return container;
}

export const appEnvironment = createAppEnvironment(process.env);