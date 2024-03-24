import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';
import { updateRecipeEntity } from '../infrastructure/persistence/recipe';

const editRecipe: AuthenticatedRequestHandler = async request => {
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
    handler: createAuthenticatedRequestHandler(editRecipe)
});
