import type { ContainerRequest, Database } from '@azure/cosmos';
import { CosmosClient } from '@azure/cosmos';

export const createCosmosDbClient = (endpoint: string, key: string) => new CosmosClient({ endpoint, key });

export const createOrGetDatabase = async (cosmosClient: CosmosClient, id: string) => {
  const { database } = await cosmosClient.databases.createIfNotExists({ id });
  return database;
};

export const createOrGetDatabaseContainer = async (database: Database, id: string, options: Omit<ContainerRequest, 'id'> = {}) => {
  const { container } = await database.containers.createIfNotExists({ id, ...options });
  return container;
};
