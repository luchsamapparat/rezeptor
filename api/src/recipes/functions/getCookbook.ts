import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';
import { getCookbookEntity } from '../infrastructure/persistence/cookbook';

const getCookbook: AuthenticatedRequestHandler = async request => {
    const cookbookContainer = await appEnvironment.get('cookbookContainer');

    const id = getStringValue(request.query, 'id');

    const cookbook = await getCookbookEntity(cookbookContainer, id);

    return {
        jsonBody: cookbook
    };
};

app.http('getCookbook', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(getCookbook)
});
