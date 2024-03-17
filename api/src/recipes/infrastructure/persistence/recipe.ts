import { Container } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { EntityId, createItem, deleteItem, getItem, getItems, updateItem } from "../../../common/infrastructure/persistence/azureCosmosDb";
import { uploadFile } from "../../../common/infrastructure/persistence/azureStorageAccount";
import { WithoutModelId } from "../../../common/model";
import { Recipe } from "../../model";

export async function createRecipeEntity(container: Container, recipe: WithoutModelId<Recipe>) {
    return createItem(container, recipe);
}

export async function updateRecipeEntity(container: Container, id: EntityId, recipe: Partial<WithoutModelId<Recipe>>) {
    return updateItem(container, id, recipe);
}

export async function deleteRecipeEntity(container: Container, id: EntityId) {
    return deleteItem(container, id);
}

export async function getRecipeEntity(container: Container, id: EntityId) {
    return getItem<Recipe>(container, id);
}

export async function getRecipeEntities(container: Container) {
    return getItems<Recipe>(container);
}

export async function uploadRecipeFile(containerClient: ContainerClient, file: File) {
    const fileName = crypto.randomUUID();
    await uploadFile(containerClient, fileName, file);
    return fileName;
}

export async function uploadPhotoFile(containerClient: ContainerClient, file: File) {
    const fileName = crypto.randomUUID();
    await uploadFile(containerClient, fileName, file);
    return fileName;
}
