import { app } from '@azure/functions';
import { appContext } from '../../appContext';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const getCookbooks: AuthenticatedRequestHandler = async ({ requestContext }) => {
  const cookbookRepository = await requestContext.cookbookRepository;

  const cookbooks = await cookbookRepository.getAll();

  return {
    jsonBody: cookbooks
  };
};

app.http('getCookbooks', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: createAuthenticatedRequestHandler(appContext, getCookbooks)
});
