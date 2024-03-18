import { Container } from "@azure/cosmos";
import { EntityId, createItem, deleteItem, getItem, getItems, updateItem } from "../../../common/infrastructure/persistence/azureCosmosDb";
import { WithoutModelId } from "../../../common/model";
import { Group } from "../../model";

export async function createGroupEntity(container: Container, group: WithoutModelId<Group>) {
    return createItem(container, group);
}

export async function updateGroupEntity(container: Container, id: EntityId, group: Partial<WithoutModelId<Group>>) {
    return updateItem(container, id, group);
}

export async function deleteRecipeEntity(container: Container, id: EntityId) {
    return deleteItem(container, id);
}

export async function getGroupEntity(container: Container, id: EntityId) {
    return getItem<Group>(container, id);
}

export async function findGroupEntityByInvitationCode(container: Container, invitationCode: Group['invitationCode']) {
    const { resources } = await container.items.query<Group>({
        query: 'SELECT * FROM g WHERE g.invitationCode = @invitationCode',
        parameters: [{
            name: '@invitationCode', value: invitationCode
        }]
    }).fetchAll();
    return resources[0] ?? null;
}

export async function getGroupEntities(container: Container) {
    return getItems<Group>(container);
}
