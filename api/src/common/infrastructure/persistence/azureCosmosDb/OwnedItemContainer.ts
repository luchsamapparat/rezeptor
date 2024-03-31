import { ContainerRequest, Database, ItemDefinition, PartitionKey, PartitionKeyBuilder, SqlQuerySpec } from "@azure/cosmos";
import { TelemetryClient } from "applicationinsights";
import { EntityId } from "./Entity";
import { GenericItemContainer, ItemContainer, createGenericItemContainer } from "./ItemContainer";

type GenericOwnership = Record<string, string>;

export const createOwnedItemContainer = async <O extends GenericOwnership>(
    database: Database,
    id: string,
    ownership: O,
    telemetry?: TelemetryClient,
    options?: Omit<ContainerRequest, 'id' | 'partitionKey'>,
): Promise<ItemContainer> => {
    const genericItemContainer = await createGenericItemContainer(
        database,
        id,
        telemetry,
        {
            ...options,
            partitionKey: {
                paths: Object.keys(ownership).map(property => `/${property}`)
            }
        }
    );
    return new OwnedItemContainer(ownership, genericItemContainer);
}

class OwnedItemContainer<O extends GenericOwnership> implements ItemContainer {

    private readonly partitionKey: PartitionKey;

    constructor(
        private readonly ownership: O,
        private readonly itemContainer: GenericItemContainer
    ) {
        this.partitionKey = buildPartitionKey(ownership);
    }

    async createItem<T extends ItemDefinition>(body: T) {
        return this.itemContainer.createItem<T>({
            ...body,
            ...this.ownership
        });
    }

    async updateItem<T extends ItemDefinition>(id: EntityId, updatedBody: T) {
        return this.itemContainer.updateItem<T>(id, this.partitionKey, updatedBody)
    }

    async deleteItem<T extends ItemDefinition>(id: EntityId) {
        this.itemContainer.deleteItem<T>(id, this.partitionKey);
    }

    async getItem<T extends ItemDefinition>(id: EntityId) {
        return this.itemContainer.getItem<T>(id, this.partitionKey);
    }

    async getItems<T extends ItemDefinition>() {
        return this.itemContainer.getItems<T>(this.partitionKey);
    }

    async queryItems<T extends ItemDefinition>(query: SqlQuerySpec) {
        return this.itemContainer.queryItems<T>(query, this.partitionKey);
    }

    async queryItem<T extends ItemDefinition>(query: SqlQuerySpec) {
        return this.itemContainer.queryItem<T>(query, this.partitionKey);
    }
}

function buildPartitionKey<O extends GenericOwnership>(ownership: O): PartitionKey {
    const partitionKeyBuilder = new PartitionKeyBuilder();
    Object.keys(ownership).forEach(key => partitionKeyBuilder.addValue(ownership[key]));
    return partitionKeyBuilder.build();
}