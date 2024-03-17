import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getCookbookEntities } from '../infrastructure/persistence/cookbook';

export async function getCookbooks(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const cookbookContainer = await appEnvironment.get('cookbookContainer');

    const cookbooks = await getCookbookEntities(cookbookContainer);

    return {
        jsonBody: cookbooks
    };
};

app.http('getCookbooks', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getCookbooks
});
