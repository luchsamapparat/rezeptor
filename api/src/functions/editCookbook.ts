import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { updateCookbookEntity } from '../infrastructure/persistence/cookbookTableStorage';
import { getStringValue } from '../infrastructure/util/form';

export async function editCookbook(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const azureStorageCookbookTableClient = await appEnvironment.get('azureStorageCookbookTableClient');

    const formData = await request.formData();

    const id = getStringValue(formData, 'id');
    const title = getStringValue(formData, 'title');
    const authors = getStringValue(formData, 'authors').split('\n')
        .map(author => author.trim())
        .filter(author => author.length > 0);

    await updateCookbookEntity(azureStorageCookbookTableClient, {
        id,
        title,
        authors
    });

    return {
        body: id
    };
};

app.http('editCookbook', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: editCookbook
});
