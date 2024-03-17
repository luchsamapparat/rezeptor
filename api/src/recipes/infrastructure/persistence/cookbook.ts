import { Container } from "@azure/cosmos";
import { EntityId, createItem, deleteItem, getItem, getItems, updateItem } from "../../../common/infrastructure/persistence/azureCosmosDb";
import { WithoutModelId } from "../../../common/model";
import { Cookbook } from "../../model";

export async function createCookbookEntity(container: Container, cookbook: WithoutModelId<Cookbook>) {
    return createItem(container, cookbook);
}

export async function updateCookbookEntity(container: Container, id: EntityId, cookbook: Partial<WithoutModelId<Cookbook>>) {
    return updateItem(container, id, cookbook);
}

export async function deleteRecipeEntity(container: Container, id: EntityId) {
    return deleteItem(container, id);
}

export async function getCookbookEntity(container: Container, id: EntityId) {
    return getItem<Cookbook>(container, id);
}

export async function getCookbookEntities(container: Container) {
    return getItems<Cookbook>(container);
}
