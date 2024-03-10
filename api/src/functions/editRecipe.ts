import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { environment } from '../environment';
import { updateRecipeEntity } from '../infrastructure/persistence/recipeTableStorage';
import { getStringValue } from '../infrastructure/util/form';

export async function editRecipe(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const formData = await request.formData();

    const id = getStringValue(formData, 'id');
    const title = getStringValue(formData, 'title');
    const pageNumber = parseInt(getStringValue(formData, 'pageNumber'));

    const recipeTableClient = await environment.getTableClient('recipe');
    await updateRecipeEntity(recipeTableClient, {
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
