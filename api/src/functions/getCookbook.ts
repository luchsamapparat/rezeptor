import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { getCookbookEntity } from '../infrastructure/persistence/cookbook';
import { getStringValue } from '../infrastructure/util/form';

export async function getCookbook(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
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
    handler: getCookbook
});
