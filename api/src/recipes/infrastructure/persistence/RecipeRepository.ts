import { EntityId, ItemContainer } from "../../../common/infrastructure/persistence/azureCosmosDb";
import { FileContainer } from "../../../common/infrastructure/persistence/azureStorageAccount";
import { WithoutModelId } from "../../../common/model";
import { Recipe } from "../../model";

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

    async uploadRecipeFile(file: File) {
        const fileName = crypto.randomUUID();
        await this.recipeFileRepository.uploadFile(fileName, file);
        return fileName;
    }

    async downloadRecipeFile(fileName: string) {
        return this.recipeFileRepository.downloadFile(fileName);
    }

    async uploadPhotoFile(file: File) {
        const fileName = crypto.randomUUID();
        await this.photoFileRepository.uploadFile(fileName, file);
        return fileName;
    }

    async downloadPhotoFile(fileName: string) {
        return this.photoFileRepository.downloadFile(fileName);
    }

}