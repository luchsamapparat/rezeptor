import { ContainerClient } from "@azure/storage-blob";
import { uploadFile } from "./blobStorage";

export const uploadImage = async (containerClient: ContainerClient, file: File) => {
    const fileName = crypto.randomUUID();
    await uploadFile(
        containerClient,
        file,
        fileName
    );
    return fileName;
}