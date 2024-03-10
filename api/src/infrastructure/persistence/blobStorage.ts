import { ContainerClient } from "@azure/storage-blob";

export async function uploadFile(containerClient: ContainerClient, file: File, fileName: string) {
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.uploadData(await file.arrayBuffer(), {
        blobHTTPHeaders: {
            blobContentType: file.type
        }
    });
}
