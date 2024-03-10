import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { environment } from '../environment';
import { getCookbookEntity } from '../infrastructure/persistence/cookbookTableStorage';
import { getStringValue } from '../infrastructure/util/form';

export async function getCookbook(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const id = getStringValue(request.query, 'id');

    const cookbookTableClient = await environment.getTableClient('cookbook');
    const cookbook = await getCookbookEntity(cookbookTableClient, id);

    return {
        jsonBody: cookbook
    };
};

app.http('getCookbook', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getCookbook
});
