import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';

const getCookbooks: AuthenticatedRequestHandler = async request => {
    const cookbookRepository = await appEnvironment.get('cookbookRepository');

    const cookbooks = await cookbookRepository.getAll();

    return {
        jsonBody: cookbooks
    };
};

app.http('getCookbooks', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(getCookbooks)
});
