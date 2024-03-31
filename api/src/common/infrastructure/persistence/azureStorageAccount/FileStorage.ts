import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { Contracts, TelemetryClient } from "applicationinsights";
import { createBlobContainerClient } from "./storage";

type GenericOwnership = readonly [string, string][];

export const createFileContainer = async <O extends GenericOwnership>(blobService: BlobServiceClient, containerName: string, ownership: O, telemetry?: TelemetryClient) => {
    const containerClient = await createBlobContainerClient(blobService, containerName);
    return new FileContainer(containerClient, createOwnershipIdentifier(ownership), telemetry);
}

const createOwnershipIdentifier = <O extends GenericOwnership>(ownership: O): string => ownership
    .map((prop, value) => `${prop}-${value}`)
    .join('/');

export class FileContainer {
    constructor(
        private readonly containerClient: ContainerClient,
        private readonly ownershipIdentifier: string,
        private readonly telemetry?: TelemetryClient
    ) { }

    async uploadFile(fileName: string, file: File) {
        const filePath = `${this.ownershipIdentifier}/${fileName}`;
        return this.trackStorageOperation(
            async () => {
                const blockBlobClient = this.containerClient.getBlockBlobClient(filePath);
                await blockBlobClient.uploadData(await file.arrayBuffer(), {
                    blobHTTPHeaders: {
                        blobContentType: file.type
                    }
                });
            },
            {
                operation: 'uploadFile',
                operationArgs: { filePath }
            }
        );
    }

    async downloadFile(fileName: string) {
        const filePath = `${this.ownershipIdentifier}/${fileName}`;
        return this.trackStorageOperation(
            async () => {
                const blockBlobClient = this.containerClient.getBlockBlobClient(filePath);

                if (!(await blockBlobClient.exists())) {
                    return null;
                }

                const fileBuffer = await blockBlobClient.downloadToBuffer();
                const contentType = (await blockBlobClient.getProperties()).contentType ?? null;
                return {
                    fileBuffer,
                    contentType
                };
            },
            {
                operation: 'downloadFile',
                operationArgs: { filePath }
            }
        );
    }

    async deleteFile(fileName: string) {
        const filePath = `${this.ownershipIdentifier}/${fileName}`;
        return this.trackStorageOperation(
            async () => {
                const blockBlobClient = this.containerClient.getBlockBlobClient(filePath);
                await blockBlobClient.deleteIfExists();
            },
            {
                operation: 'deleteFile',
                operationArgs: { filePath }
            }
        )
    }

    private async trackStorageOperation<T>(operation: () => T, additionalProperties: Record<string, any>) {
        const properties = {
            ...additionalProperties,
            container: this.containerClient.containerName
        };
        let result: T | undefined;
        const start = performance.now();
        this.telemetry?.trackTrace({
            message: 'executing storage operation',
            properties
        })
        try {
            result = await operation();
        } catch (error) {
            this.telemetry?.trackException({
                exception: (error instanceof Error) ? error : new Error(JSON.stringify(error)),
                severity: Contracts.SeverityLevel.Error,
                properties
            });
            throw error;
        }
        const end = performance.now();
        const executionTime = start - end;
        this.telemetry?.trackMetric({
            name: 'storage operation execution time',
            value: executionTime,
            properties
        });
        return result;
    }
}