import { Container, CosmosClient, Database, Item } from "@azure/cosmos";

export const createCosmosDbClient = (endpoint: string, key: string) => new CosmosClient({ endpoint, key });

export const createOrGetDatabase = async (cosmosClient: CosmosClient, id: string) => {
    const { database } = await cosmosClient.databases.createIfNotExists({ id });
    return database;
}

export const createOrGetDatabaseContainer = async (database: Database, id: string) => {
    const { container } = await database.containers.createIfNotExists({ id });
    return container;
}

export type Id = Item['id'];

export async function createItem<T extends object>(container: Container, body: T) {
    const id = crypto.randomUUID();
    await container.items.create<T>({
        id,
        ...body
    });
    return id;
}

export async function updateItem<T extends object>(container: Container, id: Id, updatedBody: T) {
    const item = container.item(id);
    const { resource } = await item.read<T>();

    await item.replace({
        ...resource,
        ...updatedBody,
    });
}

export async function deleteItem<T extends object>(container: Container, id: Id) {
    await container.item(id).delete<T>();
}

export async function getItem<T extends object>(container: Container, id: Id) {
    const { resource } = await container.item(id).read<T>();
    return resource;
}

export async function getItems<T extends object>(container: Container) {
    const { resources } = await container.items.readAll<T>().fetchAll();
    return resources;
}
