import type { Container, ContainerRequest, Database, ItemDefinition, PartitionKey, Resource, SqlQuerySpec } from '@azure/cosmos';
import type { TelemetryClient } from 'applicationinsights';
import { Contracts } from 'applicationinsights';
import { performance } from 'node:perf_hooks';
import type { EntityId } from './Entity';
import { createOrGetDatabaseContainer } from './database';

export type ItemContainer = {
    createItem: <T extends ItemDefinition>(body: T) => Promise<ItemDefinition & Resource>;
    updateItem: <T extends ItemDefinition>(id: EntityId, updatedBody: T) => Promise<ItemDefinition & Resource>;
    deleteItem: <T extends ItemDefinition>(id: EntityId, partitionKey?: PartitionKey) => Promise<void>;
    getItem: <T extends ItemDefinition>(id: EntityId, partitionKey?: PartitionKey) => Promise<(T & Resource) | null>;
    getItems: <T extends ItemDefinition>(partitionKey?: PartitionKey) => Promise<T[]>;
    queryItems: <T extends ItemDefinition>(query: SqlQuerySpec) => Promise<T[]>;
    queryItem: <T extends ItemDefinition>(query: SqlQuerySpec) => Promise<T | null>;
};

export const createGenericItemContainer = async (
  database: Database,
  id: string,
  telemetry?: TelemetryClient,
  options?: Omit<ContainerRequest, 'id'>,
) => {
  const container = await createOrGetDatabaseContainer(database, id, options);
  return new GenericItemContainer(container, telemetry);
};

export class GenericItemContainer {

  constructor(
        public readonly container: Container,
        private readonly telemetry?: TelemetryClient
  ) { }

  async createItem<T extends ItemDefinition>(body: T) {
    return this.trackContainerOperation(
      async () => {
        const id = crypto.randomUUID();
        const { resource } = await this.container.items.create<T>({
          id,
          ...body
        });
        return resource!;
      },
      {
        operation: 'createItem',
        operationArgs: { body }
      }
    );
  }

  async updateItem<T extends ItemDefinition>(id: EntityId, updatedBodyOrPartitionKey: PartitionKey | T, maybeUpdatedBody?: T): Promise<ItemDefinition & Resource> {
    const partitionKey = ((maybeUpdatedBody === undefined) ? undefined : updatedBodyOrPartitionKey) as PartitionKey | undefined;
    const updatedBody = ((maybeUpdatedBody === undefined) ? updatedBodyOrPartitionKey : maybeUpdatedBody) as T;

    return this.trackContainerOperation(
      async () => {

        const item = this.container.item(id, partitionKey);
        const { resource } = await item.read<T>();

        const { resource: updatedResource } = await item.replace({
          ...resource,
          ...updatedBody,
        });

        return updatedResource!;
      },
      {
        operation: 'updateItem',
        operationArgs: { id, partitionKey, updatedBody }
      }
    );
  }

  async deleteItem<T extends ItemDefinition>(id: EntityId, partitionKey?: PartitionKey) {
    return this.trackContainerOperation(
      async () => {
        await this.container.item(id, partitionKey).delete<T>({});
      },
      {
        operation: 'deleteItem',
        operationArgs: { id, partitionKey }
      }
    );
  }

  async getItem<T extends ItemDefinition>(id: EntityId, partitionKey?: PartitionKey) {
    return this.trackContainerOperation(
      async () => {
        const { resource } = await this.container.item(id, partitionKey).read<T>();
        return resource ?? null;
      },
      {
        operation: 'getItem',
        operationArgs: { id, partitionKey }
      }
    );
  }

  async getItems<T extends ItemDefinition>(partitionKey?: PartitionKey) {
    return this.trackContainerOperation(
      async () => {
        const { resources } = await this.container.items.readAll<T>({ partitionKey }).fetchAll();
        return resources;
      },
      {
        operation: 'getItems',
        operationArgs: { partitionKey }
      }
    );
  }

  async queryItems<T extends ItemDefinition>(query: SqlQuerySpec, partitionKey?: PartitionKey) {
    return this.trackContainerOperation(
      async () => {
        const { resources } = await this.container.items.query<T>(query, { partitionKey }).fetchAll();
        return resources;
      },
      {
        operation: 'queryItems',
        operationArgs: { query, partitionKey }
      }
    );
  }

  async queryItem<T extends ItemDefinition>(query: SqlQuerySpec, partitionKey?: PartitionKey): Promise<T | null> {
    const resources = await this.queryItems<T>(query, partitionKey);
    return resources[0] ?? null;
  }

  private async trackContainerOperation<T>(operation: () => T, additionalProperties: Record<string, any>) {
    const properties = {
      ...additionalProperties,
      container: this.container.id
    };
    let result: T | undefined;
    const start = performance.now();
    this.telemetry?.trackTrace({
      message: 'executing database operation',
      properties
    });
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
    const executionTime = end - start;
    this.telemetry?.trackMetric({
      name: 'database operation execution time',
      value: executionTime,
      properties
    });
    return result;
  }
}
