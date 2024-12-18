import type { EntityId, ItemContainer } from '../../../common/infrastructure/persistence/azureCosmosDb';
import type { FileContainer } from '../../../common/infrastructure/persistence/azureStorageAccount';
import type { WithoutModelId } from '../../../common/model';
import type { Cookbook, Recipe } from '../../model';

/** @scope * */
export class RecipeRepository {

  constructor(
    private recipeContainer: ItemContainer,
    private recipeFileRepository: FileContainer,
    private photoFileRepository: FileContainer
  ) { }

  async create(recipe: WithoutModelId<Recipe>) {
    return this.recipeContainer.createItem(recipe);
  }

  async update(id: EntityId, recipe: Partial<WithoutModelId<Recipe>>) {
    return this.recipeContainer.updateItem(id, recipe);
  }

  async delete(id: EntityId) {
    return this.recipeContainer.deleteItem(id);
  }

  async get(id: EntityId) {
    return this.recipeContainer.getItem<Recipe>(id);
  }

  async getAll() {
    return this.recipeContainer.getItems<Recipe>();
  }

  async findByCookbookId(cookbookId: Cookbook['id']) {
    return this.recipeContainer.queryItems<Recipe>({
      query: 'SELECT * FROM r WHERE r.cookbookId = @cookbookId',
      parameters: [
        { name: '@cookbookId', value: cookbookId }
      ]
    });
  }

  async uploadRecipeFile(file: File) {
    const fileName = crypto.randomUUID();
    await this.recipeFileRepository.uploadFile(fileName, file);
    return fileName;
  }

  async downloadRecipeFile(fileName: string) {
    return this.recipeFileRepository.downloadFile(fileName);
  }

  async deleteRecipeFile(fileName: string) {
    return this.recipeFileRepository.deleteFile(fileName);
  }

  async uploadPhotoFile(file: File) {
    const fileName = crypto.randomUUID();
    await this.photoFileRepository.uploadFile(fileName, file);
    return fileName;
  }

  async downloadPhotoFile(fileName: string) {
    return this.photoFileRepository.downloadFile(fileName);
  }

  async deletePhotoFile(fileName: string) {
    return this.photoFileRepository.deleteFile(fileName);
  }

}
