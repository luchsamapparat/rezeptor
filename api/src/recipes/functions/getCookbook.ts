import { app } from '@azure/functions';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { appContext } from '../../appContext';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const getCookbook: AuthenticatedRequestHandler = async ({ request, requestContext }) => {
  const cookbookRepository = await requestContext.get('cookbookRepository');

  const { id } = getCookbookQuerySchema.parse(request.query);

  const cookbook = await cookbookRepository.get(id);

  return {
    jsonBody: cookbook
  };
};

app.http('getCookbook', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: createAuthenticatedRequestHandler(appContext, getCookbook)
});

const getCookbookQuerySchema = zfd.formData({
  id: z.string().uuid(),
});
