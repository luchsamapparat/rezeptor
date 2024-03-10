import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { environment } from '../environment';
import { getCookbookEntities } from '../infrastructure/persistence/cookbookTableStorage';

export async function getCookbooks(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const cookbookTableClient = await environment.getTableClient('cookbook');
    const cookbooks = await getCookbookEntities(cookbookTableClient);

    return {
        jsonBody: cookbooks
    };
};

app.http('getCookbooks', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getCookbooks
});
