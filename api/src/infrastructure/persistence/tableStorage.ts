import { TableClient, TableEntity } from "@azure/data-tables";

export type Model<T> = T & {
    id: string;
}

export type EntityProps = {
    partitionKey: string;
    rowKey: string;
};

export type Entity<T> = TableEntity<Omit<T, 'id'>>;

export type NewEntity<T> = T & Pick<EntityProps, 'partitionKey'>;

export const toEntity = <T>(partitionKey: string, { id, ...model }: Model<T>): Entity<T> => ({
    partitionKey,
    rowKey: id,
    ...model
});

export const toNewEntity = <T>(partitionKey: string, model: T): NewEntity<T> => ({
    partitionKey,
    ...model
});

export const fromEntity = <T>({ partitionKey, rowKey, ...model }: Partial<EntityProps> & T) => ({
    id: rowKey,
    ...model
});

export async function createEntity<T extends object>(tableClient: TableClient, entity: NewEntity<T>) {
    const rowKey = crypto.randomUUID();
    await tableClient.createEntity({
        rowKey,
        ...entity
    });
    return rowKey;
}

export async function updateEntity<T extends object>(tableClient: TableClient, entity: Entity<T>) {
    const entityEntity = await tableClient.getEntity(entity.partitionKey, entity.rowKey);

    await tableClient.updateEntity({
        ...entityEntity,
        ...entity,
    }, 'Replace');
}

export async function deleteEntity<T extends object>(tableClient: TableClient, { partitionKey, rowKey }: EntityProps) {
    await tableClient.deleteEntity(partitionKey, rowKey);
}

export async function getEntity<T extends object>(tableClient: TableClient, partitionKey: string, rowKey: string) {
    return tableClient.getEntity<T>(partitionKey, rowKey);
}

export async function getEntities<T extends object>(tableClient: TableClient) {
    const iterator = tableClient.listEntities<T>();
    let entities: Entity<T>[] = [];
    for await (const entity of iterator) {
        entities.push(entity as Entity<T>);
    }
    return entities;
}
