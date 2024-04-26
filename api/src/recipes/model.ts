import type { Model, ModelId } from '../common/model';

export type Recipe = Model<{
    title: string;
    content: string;
    photoFileId: ModelId | null;
    recipeFileId: ModelId | null;
    cookbookId: ModelId;
    pageNumber: number | null;
}>;

export type Cookbook = Model<{
    title: string;
    authors: string[];
    isbn10: string | null;
    isbn13: string | null;
}>;
