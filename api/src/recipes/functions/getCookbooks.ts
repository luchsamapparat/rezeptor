import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';

const getCookbooks: AuthenticatedRequestHandler = async ({ requestEnv }) => {
    const cookbookRepository = await requestEnv.get('cookbookRepository');

    const cookbooks = await cookbookRepository.getAll();

    return {
        jsonBody: cookbooks
    };
};

app.http('getCookbooks', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(appEnvironment, getCookbooks)
});
