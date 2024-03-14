import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { getCookbookEntities } from '../infrastructure/persistence/cookbookTableStorage';

export async function getCookbooks(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const azureStorageCookbookTableClient = await appEnvironment.get('azureStorageCookbookTableClient');

    const cookbooks = await getCookbookEntities(azureStorageCookbookTableClient);

    return {
        jsonBody: cookbooks
    };
};

app.http('getCookbooks', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getCookbooks
});
