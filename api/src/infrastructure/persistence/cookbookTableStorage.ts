import { TableClient } from "@azure/data-tables";
import { Entity, Model, NewEntity, createEntity, deleteEntity, fromEntity, getEntities, getEntity, toEntity, toNewEntity, updateEntity } from "./tableStorage";

type Cookbook = {
    title: string;
    authors: string[];
    isbn10: string | null;
    isbn13: string | null;
};

type SerializedCookbook = Omit<Cookbook, 'authors'> & {
    authors: string;
};

export type CookbookModel = Model<Cookbook>;

type CookbookEntity = Entity<SerializedCookbook>;

type NewCookbook = Cookbook;
type NewCookbookEntity = NewEntity<SerializedCookbook>;

type UpdatedCookbookModel = Model<Partial<Cookbook>>;
type UpdatedCookbookEntity = Entity<Partial<SerializedCookbook>>

const partitionKey = 'cookbook';

const toNewCookbookEntity = (cookbook: NewCookbook): NewCookbookEntity => toNewEntity<SerializedCookbook>(partitionKey, {
    ...cookbook,
    authors: JSON.stringify(cookbook.authors)
});

function toCookbookEntity({ id, ...cookbook }: UpdatedCookbookModel): UpdatedCookbookEntity
function toCookbookEntity({ id, ...cookbook }: CookbookModel): CookbookEntity
function toCookbookEntity({ id, ...cookbook }: CookbookModel | UpdatedCookbookModel) {
    return toEntity(partitionKey, {
        id,
        title: cookbook.title,
        authors: JSON.stringify(cookbook.authors),
        // blob storage client does not return null values
        isbn10: cookbook.isbn10 ?? null,
        isbn13: cookbook.isbn13 ?? null
    });
}

const fromCookbookEntity = ({ partitionKey, rowKey, ...cookbook }: CookbookEntity): CookbookModel => fromEntity({
    id: rowKey,
    ...cookbook,
    authors: JSON.parse(cookbook.authors) as string[]
});

export async function createCookbookEntity(tableClient: TableClient, cookbook: NewCookbook) {
    return createEntity(tableClient, toNewCookbookEntity(cookbook));
}

export async function updateCookbookEntity(tableClient: TableClient, cookbook: UpdatedCookbookModel) {
    return updateEntity(tableClient, toCookbookEntity(cookbook));
}

export async function deleteRecipeEntity(tableClient: TableClient, id: CookbookModel['id']) {
    return deleteEntity(tableClient, {
        partitionKey,
        rowKey: id
    });
}

export async function getCookbookEntity(tableClient: TableClient, id: string) {
    const entity = await getEntity<CookbookEntity>(tableClient, partitionKey, id);
    return fromCookbookEntity(entity);
}

export async function getCookbookEntities(tableClient: TableClient) {
    const entities = await getEntities<CookbookEntity>(tableClient);
    return entities.map(fromCookbookEntity);
}
