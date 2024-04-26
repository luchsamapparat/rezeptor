import type { EntityId, ItemContainer } from '../../../common/infrastructure/persistence/azureCosmosDb';
import type { WithoutModelId } from '../../../common/model';
import type { Cookbook } from '../../model';

/** @scope * */
export class CookbookRepository {

  constructor(
    private cookbookContainer: ItemContainer
  ) { }

  async create(cookbook: WithoutModelId<Cookbook>) {
    return this.cookbookContainer.createItem(cookbook);
  }

  async update(id: EntityId, cookbook: Partial<WithoutModelId<Cookbook>>) {
    return this.cookbookContainer.updateItem(id, cookbook);
  }

  async delete(id: EntityId) {
    return this.cookbookContainer.deleteItem(id);
  }

  async get(id: EntityId) {
    return this.cookbookContainer.getItem<Cookbook>(id);
  }

  async getAll() {
    return this.cookbookContainer.getItems<Cookbook>();
  }
}
