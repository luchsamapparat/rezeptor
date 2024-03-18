import { Container } from "@azure/cosmos";
import { EntityId, createItem, deleteItem } from "../../../common/infrastructure/persistence/azureCosmosDb";
import { WithoutModelId } from "../../../common/model";
import { Challenge } from "../../model";

export async function createChallengeEntity(container: Container, challenge: WithoutModelId<Challenge>) {
    return createItem(container, challenge);
}

export async function deleteChallengeEntity(container: Container, id: EntityId) {
    return deleteItem(container, id);
}

export async function findChallengeEntitiesByGroupIdAndType(container: Container, groupId: Challenge['groupId'], type: Challenge['type']) {
    const { resources } = await container.items.query<Challenge>({
        query: 'SELECT * FROM c WHERE c.groupId = @groupId AND c.type = @type',
        parameters: [{
            name: '@groupId', value: groupId
        }, {
            name: '@type', value: type
        }]
    }).fetchAll();
    return resources;
}
