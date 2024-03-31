import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';

const getCookbook: AuthenticatedRequestHandler = async ({ request, requestEnv }) => {
    const cookbookRepository = await requestEnv.get('cookbookRepository');

    const id = getStringValue(request.query, 'id');

    const cookbook = await cookbookRepository.get(id);

    return {
        jsonBody: cookbook
    };
};

app.http('getCookbook', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(appEnvironment, getCookbook)
});
