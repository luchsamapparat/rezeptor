import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';
import { getRecipeEntity } from '../infrastructure/persistence/recipe';

const getRecipe: AuthenticatedRequestHandler = async request => {
    const recipeContainer = await appEnvironment.get('recipeContainer');

    const id = getStringValue(request.query, 'id');

    const recipe = await getRecipeEntity(recipeContainer, id);

    return {
        jsonBody: recipe
    };
};

app.http('getRecipe', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(getRecipe)
});
