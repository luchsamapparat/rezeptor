import { TableClient } from "@azure/data-tables";
import { Entity, Model, NewEntity, createEntity, deleteEntity, fromEntity, getEntities, getEntity, toEntity, toNewEntity, updateEntity } from "./tableStorage";

type Recipe = {
    title: string;
    photoFileId: string | null;
    recipeFileId: string | null;
    cookbookId: string;
    pageNumber: number | null;
};

export type RecipeModel = Model<Recipe>;

type RecipeEntity = Entity<Recipe>;

type NewRecipe = Recipe;
type NewRecipeEntity = NewEntity<Recipe>;

type UpdatedRecipeModel = Model<Partial<Recipe>>;
type UpdatedRecipeEntity = Entity<Partial<Recipe>>;

const partitionKey = 'recipe';

const toNewRecipeEntity = (recipe: NewRecipe): NewRecipeEntity => toNewEntity<Recipe>(partitionKey, recipe);

function toRecipeEntity({ id, ...recipe }: UpdatedRecipeModel): UpdatedRecipeEntity
function toRecipeEntity({ id, ...recipe }: RecipeModel): RecipeEntity
function toRecipeEntity({ id, ...recipe }: RecipeModel | UpdatedRecipeModel) {
    return toEntity(partitionKey, {
        id,
        ...recipe
    });
}

const fromRecipeEntity = ({ partitionKey, rowKey, ...recipe }: RecipeEntity): RecipeModel => fromEntity({
    id: rowKey,
    title: recipe.title,
    // blob storage client does not return null values
    photoFileId: recipe.photoFileId ?? null,
    recipeFileId: recipe.recipeFileId ?? null,
    cookbookId: recipe.cookbookId,
    pageNumber: recipe.pageNumber ?? null,
});

export async function createRecipeEntity(tableClient: TableClient, recipe: NewRecipe) {
    return createEntity(tableClient, toNewRecipeEntity(recipe));
}

export async function updateRecipeEntity(tableClient: TableClient, recipe: UpdatedRecipeModel) {
    return updateEntity(tableClient, toRecipeEntity(recipe));
}

export async function deleteRecipeEntity(tableClient: TableClient, id: RecipeModel['id']) {
    return deleteEntity(tableClient, {
        partitionKey,
        rowKey: id
    });
}

export async function getRecipeEntity(tableClient: TableClient, id: string) {
    const entity = await getEntity<RecipeEntity>(tableClient, partitionKey, id);
    return fromRecipeEntity(entity);
}

export async function getRecipeEntities(tableClient: TableClient) {
    const entities = await getEntities<RecipeEntity>(tableClient);
    return entities.map(fromRecipeEntity);
}
