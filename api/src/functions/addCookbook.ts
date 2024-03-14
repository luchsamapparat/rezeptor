import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { extractBarcode } from '../infrastructure/api/azureDocumentIntelligence';
import { findBook } from '../infrastructure/api/googleBooks';
import { createCookbookEntity } from '../infrastructure/persistence/cookbookTableStorage';
import { getFile } from '../infrastructure/util/form';

export async function addCookbook(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const azureDocumentIntelligenceApiClient = appEnvironment.get('azureDocumentIntelligenceApiClient');
    const googleBooksApiClient = appEnvironment.get('googleBooksApiClient');
    const azureStorageCookbookTableClient = await appEnvironment.get('azureStorageCookbookTableClient');

    const formData = await request.formData();

    const backCoverFile = getFile(formData, 'backCoverFile');

    const { ean13 } = await extractBarcode(azureDocumentIntelligenceApiClient, backCoverFile);

    if (ean13 === null) {
        throw new Error(`No EAN 13 barcode found.`);
    }

    const book = await findBook(googleBooksApiClient, ean13);

    if (book === null) {
        throw new Error(`No book found for ${ean13}.`);
    }

    const cookbookId = await createCookbookEntity(azureStorageCookbookTableClient, book);

    return {
        body: cookbookId
    };
};

app.http('addCookbook', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: addCookbook
});
