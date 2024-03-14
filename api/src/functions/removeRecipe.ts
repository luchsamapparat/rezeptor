import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { deleteRecipeEntity } from '../infrastructure/persistence/recipeTableStorage';
import { getStringValue } from '../infrastructure/util/form';

export async function removeRecipe(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const azureStorageRecipeTableClient = await appEnvironment.get('azureStorageRecipeTableClient');

    const formData = await request.formData();

    const id = getStringValue(formData, 'id');

    await deleteRecipeEntity(azureStorageRecipeTableClient, id);

    return {
        body: null
    };
};

app.http('removeRecipe', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: removeRecipe
});
