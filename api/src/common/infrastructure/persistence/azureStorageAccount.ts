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

export class FileContainer {
    constructor(
        public readonly containerClient: ContainerClient
    ) { }

    async uploadFile(fileName: string, file: File) {
        const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
        await blockBlobClient.uploadData(await file.arrayBuffer(), {
            blobHTTPHeaders: {
                blobContentType: file.type
            }
        });
    }

    async downloadFile(fileName: string) {
        const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);

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
}