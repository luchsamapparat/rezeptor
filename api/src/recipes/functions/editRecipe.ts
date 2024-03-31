import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';

const editRecipe: AuthenticatedRequestHandler = async ({ request, requestEnv }) => {
    const recipeRepository = await requestEnv.get('recipeRepository');

    const formData = await request.formData();

    const id = getStringValue(formData, 'id');
    const title = getStringValue(formData, 'title');
    const pageNumber = parseInt(getStringValue(formData, 'pageNumber'));
    const cookbookId = getStringValue(formData, 'cookbookId');

    await recipeRepository.update(id, {
        title,
        pageNumber,
        cookbookId
    });

    return {
        body: id
    };
};

app.http('editRecipe', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(appEnvironment, editRecipe)
});
