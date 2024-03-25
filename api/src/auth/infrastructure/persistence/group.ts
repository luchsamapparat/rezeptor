import { EntityId, ItemContainer } from "../../../common/infrastructure/persistence/azureCosmosDb";
import { WithoutModelId } from "../../../common/model";
import { Group } from "../../model";

export class GroupRepository {

    constructor(
        private groupContainer: ItemContainer
    ) { }

    async create(group: WithoutModelId<Group>) {
        return this.groupContainer.createItem(group);
    }

    async update(id: EntityId, group: Partial<WithoutModelId<Group>>) {
        return this.groupContainer.updateItem(id, group);
    }

    async delete(id: EntityId) {
        return this.groupContainer.deleteItem(id);
    }

    async get(id: EntityId) {
        return this.groupContainer.getItem<Group>(id);
    }

    async findByInvitationCode(invitationCode: Group['invitationCode']) {
        const { resources } = await this.groupContainer.container.items.query<Group>({
            query: 'SELECT * FROM g WHERE g.invitationCode = @invitationCode',
            parameters: [{
                name: '@invitationCode', value: invitationCode
            }]
        }).fetchAll();
        return resources[0] ?? null;
    }

    async getGroupEntities() {
        return this.groupContainer.getItems<Group>();
    }

}
