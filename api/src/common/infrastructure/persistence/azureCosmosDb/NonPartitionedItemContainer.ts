import type { ContainerRequest, Database } from '@azure/cosmos';
import type { TelemetryClient } from 'applicationinsights';
import type { ItemContainer } from './ItemContainer';
import { createGenericItemContainer } from './ItemContainer';

export const createNonPartitionedItemContainer = async (
  database: Database,
  id: string,
  telemetry?: TelemetryClient,
  options?: Omit<ContainerRequest, 'id'>,
): Promise<ItemContainer> => createGenericItemContainer(
  database,
  id,
  telemetry,
  options
);

