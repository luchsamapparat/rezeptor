import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';
import { getRecipeEntities } from '../infrastructure/persistence/recipe';

const getRecipes: AuthenticatedRequestHandler = async request => {
    const recipeContainer = await appEnvironment.get('recipeContainer');

    const recipes = await getRecipeEntities(recipeContainer);

    return {
        jsonBody: recipes
    };
};

app.http('getRecipes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(getRecipes)
});
