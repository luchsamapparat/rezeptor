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
