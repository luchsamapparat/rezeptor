import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';
import { updateCookbookEntity } from '../infrastructure/persistence/cookbook';

const editCookbook: AuthenticatedRequestHandler = async request => {
    const cookbookContainer = await appEnvironment.get('cookbookContainer');

    const formData = await request.formData();

    const id = getStringValue(formData, 'id');
    const title = getStringValue(formData, 'title');
    const authors = getStringValue(formData, 'authors').split('\n')
        .map(author => author.trim())
        .filter(author => author.length > 0);

    await updateCookbookEntity(cookbookContainer, id, {
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
    handler: createAuthenticatedRequestHandler(editCookbook)
});
