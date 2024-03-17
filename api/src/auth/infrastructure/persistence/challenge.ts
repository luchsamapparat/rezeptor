import { Container } from "@azure/cosmos";
import { createItem } from "../../../common/infrastructure/persistence/azureCosmosDb";
import { WithoutModelId } from "../../../common/model";
import { Challenge } from "../../model";

export async function createChallengeEntity(container: Container, challenge: WithoutModelId<Challenge>) {
    return createItem(container, challenge);
}

export async function findChallengeEntitiesByGroupIdAndType(container: Container, groupId: Challenge['groupId'], type: Challenge['type']) {
    const { resources } = await container.items.query<Challenge>({
        query: 'SELECT * FROM challenge c WHERE c.groupId = @groupId AND c.type = @type',
        parameters: [{
            name: '@groupId', value: groupId
        }, {
            name: '@type', value: type
        }]
    }).fetchAll();
    return resources;
}
