import { Container, ContainerRequest, Database, ItemDefinition, PartitionKey, Resource, SqlQuerySpec } from "@azure/cosmos";
import { TelemetryClient } from "applicationinsights";
import { EntityId } from "./Entity";
import { createOrGetDatabaseContainer } from "./database";

export type ItemContainer = {
    createItem<T extends ItemDefinition>(body: T): Promise<ItemDefinition & Resource>;
    updateItem<T extends ItemDefinition>(id: EntityId, updatedBody: T): Promise<ItemDefinition & Resource>;
    deleteItem<T extends ItemDefinition>(id: EntityId, partitionKey?: PartitionKey): Promise<void>;
    getItem<T extends ItemDefinition>(id: EntityId, partitionKey?: PartitionKey): Promise<(T & Resource) | null>
    getItems<T extends ItemDefinition>(partitionKey?: PartitionKey): Promise<T[]>;
    queryItems<T extends ItemDefinition>(query: SqlQuerySpec): Promise<T[]>;
    queryItem<T extends ItemDefinition>(query: SqlQuerySpec): Promise<T | null>;
}

export const createGenericItemContainer = async (
    database: Database,
    id: string,
    telemetry?: TelemetryClient,
    options?: Omit<ContainerRequest, 'id'>,
) => {
    const container = await createOrGetDatabaseContainer(database, id, options);
    return new GenericItemContainer(container, telemetry);
}

export class GenericItemContainer {

    constructor(
        public readonly container: Container,
        private readonly telemetry?: TelemetryClient
    ) { }

    async createItem<T extends ItemDefinition>(body: T) {
        const id = crypto.randomUUID();
        const { resource } = await this.container.items.create<T>({
            id,
            ...body
        });
        return resource!;
    }

    async updateItem<T extends ItemDefinition>(id: EntityId, updatedBodyOrPartitionKey: PartitionKey | T, maybeUpdatedBody?: T): Promise<ItemDefinition & Resource> {
        const partitionKey = ((maybeUpdatedBody === undefined) ? undefined : updatedBodyOrPartitionKey) as PartitionKey | undefined;
        const updatedBody = ((maybeUpdatedBody === undefined) ? updatedBodyOrPartitionKey : maybeUpdatedBody) as T;

        const item = this.container.item(id, partitionKey);
        const { resource } = await item.read<T>();

        const { resource: updatedResource } = await item.replace({
            ...resource,
            ...updatedBody,
        });

        return updatedResource!;
    }

    async deleteItem<T extends ItemDefinition>(id: EntityId, partitionKey?: PartitionKey) {
        await this.container.item(id, partitionKey).delete<T>({});
    }

    async getItem<T extends ItemDefinition>(id: EntityId, partitionKey?: PartitionKey) {
        const { resource } = await this.container.item(id, partitionKey).read<T>();
        return resource ?? null;
    }

    async getItems<T extends ItemDefinition>(partitionKey?: PartitionKey) {
        const { resources } = await this.container.items.readAll<T>({ partitionKey }).fetchAll();
        return resources;
    }

    async queryItems<T extends ItemDefinition>(query: SqlQuerySpec, partitionKey?: PartitionKey) {
        const { resources } = await this.container.items.query<T>(query, { partitionKey }).fetchAll();
        return resources;
    }

    async queryItem<T extends ItemDefinition>(query: SqlQuerySpec, partitionKey?: PartitionKey): Promise<T | null> {
        const resources = await this.queryItems<T>(query, partitionKey);
        return resources[0] ?? null;
    }
}
