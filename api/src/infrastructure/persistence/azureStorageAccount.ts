import { AzureNamedKeyCredential, TableClient, TableServiceClient } from "@azure/data-tables";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";

export const createBlobServiceClient = (blobEndpoint: string, accountName: string, accountKey: string) => new BlobServiceClient(
    blobEndpoint,
    new StorageSharedKeyCredential(accountName, accountKey)
);

export const createBlobContainerClient = async (storageClient: BlobServiceClient, containerName: string) => {
    const containerClient = storageClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    return containerClient;
}

export const createTableClient = async (tableEndpoint: string, tableName: string, accountName: string, accountKey: string) => {
    const credential = new AzureNamedKeyCredential(accountName, accountKey);
    const options = {
        allowInsecureConnection: isLocalEndpoint(tableEndpoint)
    };

    const tableServiceClient = new TableServiceClient(
        tableEndpoint,
        credential,
        options
    );
    await tableServiceClient.createTable(tableName);

    return new TableClient(
        tableEndpoint,
        tableName,
        credential,
        options
    )

};

const isLocalEndpoint = (endpoint: string) => endpoint.startsWith('http://127.0.0.1') || endpoint.startsWith('http://localhost');
