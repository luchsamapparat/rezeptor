import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { getRecipeEntities } from '../infrastructure/persistence/recipeTableStorage';

export async function getRecipes(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const azureStorageRecipeTableClient = await appEnvironment.get('azureStorageRecipeTableClient');

    const recipes = await getRecipeEntities(azureStorageRecipeTableClient);

    return {
        jsonBody: recipes
    };
};

app.http('getRecipes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getRecipes
});
