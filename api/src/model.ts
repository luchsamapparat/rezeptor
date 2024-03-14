export type Recipe = {
    title: string;
    photoFileId: string | null;
    recipeFileId: string | null;
    cookbookId: string;
    pageNumber: number | null;
};

export type Cookbook = {
    title: string;
    authors: string[];
    isbn10: string | null;
    isbn13: string | null;
};