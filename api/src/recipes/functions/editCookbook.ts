import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const editCookbook: AuthenticatedRequestHandler = async ({ request, requestEnv }) => {
  const cookbookRepository = await requestEnv.get('cookbookRepository');

  const formData = await request.formData();

  const id = getStringValue(formData, 'id');
  const title = getStringValue(formData, 'title');
  const authors = getStringValue(formData, 'authors').split('\n')
    .map(author => author.trim())
    .filter(author => author.length > 0);

  await cookbookRepository.update(id, {
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
  handler: createAuthenticatedRequestHandler(appEnvironment, editCookbook)
});
