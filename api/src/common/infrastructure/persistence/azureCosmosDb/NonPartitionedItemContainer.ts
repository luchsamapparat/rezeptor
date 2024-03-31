import { ContainerRequest, Database } from "@azure/cosmos";
import { TelemetryClient } from "applicationinsights";
import { ItemContainer, createGenericItemContainer } from "./ItemContainer";

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

