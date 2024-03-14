import { Container } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { Recipe } from "../../model";
import { Id, createItem, deleteItem, getItem, getItems, updateItem } from "./azureCosmosDb";
import { uploadFile } from "./azureStorageAccount";

export async function createRecipeEntity(container: Container, recipe: Recipe) {
    return createItem(container, recipe);
}

export async function updateRecipeEntity(container: Container, id: Id, recipe: Partial<Recipe>) {
    return updateItem(container, id, recipe);
}

export async function deleteRecipeEntity(container: Container, id: Id) {
    return deleteItem(container, id);
}

export async function getRecipeEntity(container: Container, id: Id) {
    return getItem(container, id);
}

export async function getRecipeEntities(container: Container) {
    return getItems(container);
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
