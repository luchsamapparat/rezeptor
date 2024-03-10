import { isNull, isUndefined } from "lodash-es";

export type CookbookDto = {
    id: string;
    title: string;
    authors: string[];
    isbn10: string | null;
    isbn13: string | null;
}

export type Cookbook = CookbookDto;

export type RecipeDto = {
    id: string;
    title: string;
    photoFileId: string | null;
    recipeFileId: string | null;
    cookbookId: string;
    pageNumber: number | null;
}

export type Recipe = Omit<RecipeDto, 'cookbookId' | 'photoFileId'> & {
    cookbook: Cookbook;
    photoFileUrl: string | null;
}

export const toRecipe = (cookbooks: Cookbook[], baseUrl: string, { cookbookId, ...recipe }: RecipeDto): Recipe => {
    const cookbook = cookbooks.find(({ id }) => cookbookId === id);

    if (isUndefined(cookbook)) {
        throw new Error(`no cookbook found for ${recipe.title}`);
    }

    return ({
        ...recipe,
        cookbook,
        photoFileUrl: isNull(recipe.photoFileId) ? null : `${baseUrl}/getRecipePhoto?id=${recipe.photoFileId}`
    });
}

export const getRecipeMapper = (cookbooks: Cookbook[], baseUrl: string) => (recipe: RecipeDto) => toRecipe(cookbooks, baseUrl, recipe);