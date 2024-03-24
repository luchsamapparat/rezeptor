import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';
import { getCookbookEntities } from '../infrastructure/persistence/cookbook';

const getCookbooks: AuthenticatedRequestHandler = async request => {
    const cookbookContainer = await appEnvironment.get('cookbookContainer');

    const cookbooks = await getCookbookEntities(cookbookContainer);

    return {
        jsonBody: cookbooks
    };
};

app.http('getCookbooks', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(getCookbooks)
});
