import { Container } from "@azure/cosmos";
import { EntityId, createItem, getItem } from "../../../common/infrastructure/persistence/azureCosmosDb";
import { WithoutModelId } from "../../../common/model";
import { Session } from "../../model";

export async function createSessionEntity(container: Container, session: WithoutModelId<Session>) {
    return createItem(container, session);
}

export async function getSessionEntity(container: Container, id: EntityId) {
    return getItem<Session>(container, id);
}