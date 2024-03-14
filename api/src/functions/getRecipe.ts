import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { getRecipeEntity } from '../infrastructure/persistence/recipeTableStorage';
import { getStringValue } from '../infrastructure/util/form';

export async function getRecipe(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const azureStorageRecipeTableClient = await appEnvironment.get('azureStorageRecipeTableClient');

    const id = getStringValue(request.query, 'id');

    const recipe = await getRecipeEntity(azureStorageRecipeTableClient, id);

    return {
        jsonBody: recipe
    };
};

app.http('getRecipe', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getRecipe
});
