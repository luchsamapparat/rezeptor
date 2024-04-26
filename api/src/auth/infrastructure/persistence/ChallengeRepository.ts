import type { EntityId, ItemContainer } from '../../../common/infrastructure/persistence/azureCosmosDb';
import type { WithoutModelId } from '../../../common/model';
import type { Challenge } from '../../model';

/** @scope * */
export class ChallengeRepository {

  constructor(
    private challengeContainer: ItemContainer
  ) { }

  async create(challenge: WithoutModelId<Challenge>) {
    return this.challengeContainer.createItem(challenge);
  }

  async delete(id: EntityId) {
    return this.challengeContainer.deleteItem(id);
  }

  async findByGroupIdAndType(groupId: Challenge['groupId'], type: Challenge['type']) {
    return this.challengeContainer.queryItems<Challenge>({
      query: 'SELECT * FROM c WHERE c.groupId = @groupId AND c.type = @type',
      parameters: [
        { name: '@groupId', value: groupId },
        { name: '@type', value: type }
      ]
    });
  }

}
