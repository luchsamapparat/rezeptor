import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from "@azure/storage-blob";

export const createBlobServiceClient = (blobEndpoint: string, accountName: string, accountKey: string) => new BlobServiceClient(
    blobEndpoint,
    new StorageSharedKeyCredential(accountName, accountKey)
);

export const createBlobContainerClient = async (storageClient: BlobServiceClient, containerName: string) => {
    const containerClient = storageClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    return containerClient;
}

export async function uploadFile(containerClient: ContainerClient, fileName: string, file: File) {
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.uploadData(await file.arrayBuffer(), {
        blobHTTPHeaders: {
            blobContentType: file.type
        }
    });
}

export async function downloadFile(containerClient: ContainerClient, fileName: string) {
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    if (!(await blockBlobClient.exists())) {
        return null;
    }

    const fileBuffer = await blockBlobClient.downloadToBuffer();
    const contentType = (await blockBlobClient.getProperties()).contentType ?? null;
    return {
        fileBuffer,
        contentType
    };
}