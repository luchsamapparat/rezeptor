import { Container, ContainerRequest, CosmosClient, Database, Item, ItemDefinition } from "@azure/cosmos";
import { TelemetryClient } from "applicationinsights";

export const createCosmosDbClient = (endpoint: string, key: string) => new CosmosClient({ endpoint, key });

export const createOrGetDatabase = async (cosmosClient: CosmosClient, id: string) => {
    const { database } = await cosmosClient.databases.createIfNotExists({ id });
    return database;
}

const createOrGetDatabaseContainer = async (database: Database, id: string, options: Omit<ContainerRequest, 'id'> = {}) => {
    const { container } = await database.containers.createIfNotExists({ id, ...options });
    return container;
}

export const createItemContainer = async (telemetry: TelemetryClient, database: Database, id: string, options?: Omit<ContainerRequest, 'id'>) => {
    const container = await createOrGetDatabaseContainer(database, id, options);
    return new ItemContainer(container, telemetry);
}

export type EntityId = Item['id'];

export class ItemContainer {

    constructor(
        public readonly container: Container,
        private readonly telemetry: TelemetryClient
    ) { }

    async createItem<T extends ItemDefinition>(body: T) {
        const id = crypto.randomUUID();
        const { resource } = await this.container.items.create<T>({
            id,
            ...body
        });
        return resource!;
    }

    async updateItem<T extends ItemDefinition>(id: EntityId, updatedBody: T) {
        const item = this.container.item(id);
        const { resource } = await item.read<T>();

        const { resource: updatedResource } = await item.replace({
            ...resource,
            ...updatedBody,
        });

        return updatedResource!;
    }

    async deleteItem<T extends ItemDefinition>(id: EntityId) {
        await this.container.item(id).delete<T>();
    }

    async getItem<T extends ItemDefinition>(id: EntityId) {
        const { resource } = await this.container.item(id).read<T>();
        return resource ?? null;
    }

    async getItems<T extends ItemDefinition>() {
        const { resources } = await this.container.items.readAll<T>().fetchAll();
        return resources;
    }


}
