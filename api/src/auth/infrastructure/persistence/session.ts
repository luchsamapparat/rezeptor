import { EntityId, ItemContainer } from "../../../common/infrastructure/persistence/azureCosmosDb";
import { WithoutModelId } from "../../../common/model";
import { Session } from "../../model";

export class SessionRepository {

    constructor(
        private sessionContainer: ItemContainer
    ) { }

    async create(session: WithoutModelId<Session>) {
        return this.sessionContainer.createItem(session);
    }

    async delete(id: EntityId) {
        return this.sessionContainer.deleteItem(id);
    }

    async get(id: EntityId) {
        return this.sessionContainer.getItem<Session>(id);
    }

}