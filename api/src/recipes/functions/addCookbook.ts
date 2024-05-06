import { app } from '@azure/functions';
import { zfd } from 'zod-form-data';
import { appEnvironment } from '../../appEnvironment';
import type { WithoutModelId } from '../../common/model';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';
import { extractBarcode } from '../infrastructure/api/azureDocumentIntelligence';
import { findBook } from '../infrastructure/api/googleBooks';
import type { Cookbook } from '../model';

const addCookbook: AuthenticatedRequestHandler = async ({ request, env, requestEnv }) => {
  const documentAnalysisApi = env.get('documentAnalysisApi');
  const booksApi = env.get('booksApi');
  const cookbookRepository = await requestEnv.get('cookbookRepository');

  const { backCoverFile } = addCookbookRequestBodySchema.parse(await request.formData());

  const { ean13 } = await extractBarcode(documentAnalysisApi, backCoverFile);

  let cookbook: WithoutModelId<Cookbook> = {
    title: '',
    authors: [],
    isbn10: null,
    isbn13: null
  };

  if (ean13 !== null) {
    const book = await findBook(booksApi, ean13);

    if (book !== null) {
      cookbook = book;
    }
  }

  const { id: cookbookId } = await cookbookRepository.create(cookbook);

  return {
    body: cookbookId
  };
};

app.http('addCookbook', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createAuthenticatedRequestHandler(appEnvironment, addCookbook)
});

const addCookbookRequestBodySchema = zfd.formData({
  backCoverFile: zfd.file()
});
