import { Container } from "@azure/cosmos";
import { Cookbook } from "../../model";
import { Id, createItem, deleteItem, getItem, getItems, updateItem } from "./azureCosmosDb";

export async function createCookbookEntity(container: Container, cookbook: Cookbook) {
    return createItem(container, cookbook);
}

export async function updateCookbookEntity(container: Container, id: Id, cookbook: Partial<Cookbook>) {
    return updateItem(container, id, cookbook);
}

export async function deleteRecipeEntity(container: Container, id: Id) {
    return deleteItem(container, id);
}

export async function getCookbookEntity(container: Container, id: Id) {
    return getItem(container, id);
}

export async function getCookbookEntities(container: Container) {
    return getItems(container);
}
