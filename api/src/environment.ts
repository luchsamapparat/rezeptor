import { DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { TableClient } from "@azure/data-tables";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { books_v1 } from "@googleapis/books";
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
    AZURE_STORAGE_BLOG_ENDPOINT: z.string().url(),
    AZURE_STORAGE_TABLE_ENDPOINT: z.string().url(),
});

type Environment = z.infer<typeof environmentSchema>;

let blobServiceClient: BlobServiceClient | null = null;
let blobContainerClients: Record<string, ContainerClient> = {};
let tableClients: Record<string, TableClient> = {};
let googleBooksApiClient: books_v1.Books | null = null;
let azureDocumentAnalysisApiClient: DocumentAnalysisClient | null = null;

const initEnvironment = (env: NodeJS.ProcessEnv) => {
    const environment: Environment = environmentSchema.parse(env);

    return {
        getBlobServiceClient() {
            return blobServiceClient ??= createBlobServiceClient(
                environment.AZURE_STORAGE_BLOG_ENDPOINT,
                environment.AZURE_STORAGE_ACCOUNT_NAME,
                environment.AZURE_STORAGE_ACCOUNT_KEY
            );
        },

        async getBlobContainerClient(containerName: string) {
            return blobContainerClients[containerName] ??= await createBlobContainerClient(
                this.getBlobServiceClient(),
                containerName
            );
        },

        async getTableClient(tableName: string) {
            return tableClients[tableName] ??= await createTableClient(
                environment.AZURE_STORAGE_TABLE_ENDPOINT,
                tableName,
                environment.AZURE_STORAGE_ACCOUNT_NAME,
                environment.AZURE_STORAGE_ACCOUNT_KEY
            )
        },

        getGoogleBooksApiClient() {
            return googleBooksApiClient ??= createGoogleBooksApiClient(
                environment.GOOGLE_API_KEY
            );
        },

        getAzureDocumentIntelligenceApiClient() {
            return azureDocumentAnalysisApiClient ??= createAzureDocumentAnalysisApiClient(
                environment.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
                environment.AZURE_DOCUMENT_INTELLIGENCE_KEY
            );
        }
    }
};

export const environment = initEnvironment(process.env);