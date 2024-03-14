import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { updateRecipeEntity } from '../infrastructure/persistence/recipeTableStorage';
import { getStringValue } from '../infrastructure/util/form';

export async function editRecipe(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const azureStorageRecipeTableClient = await appEnvironment.get('azureStorageRecipeTableClient');

    const formData = await request.formData();

    const id = getStringValue(formData, 'id');
    const title = getStringValue(formData, 'title');
    const pageNumber = parseInt(getStringValue(formData, 'pageNumber'));

    await updateRecipeEntity(azureStorageRecipeTableClient, {
        id,
        title,
        pageNumber
    });

    return {
        body: id
    };
};

app.http('editRecipe', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: editRecipe
});
