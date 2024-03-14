import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { updateRecipeEntity } from '../infrastructure/persistence/recipe';
import { getStringValue } from '../infrastructure/util/form';

export async function editRecipe(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const recipeContainer = await appEnvironment.get('recipeContainer');

    const formData = await request.formData();

    const id = getStringValue(formData, 'id');
    const title = getStringValue(formData, 'title');
    const pageNumber = parseInt(getStringValue(formData, 'pageNumber'));

    await updateRecipeEntity(recipeContainer, id, {
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
