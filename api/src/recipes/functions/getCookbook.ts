import { app } from '@azure/functions';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { appEnvironment } from '../../appEnvironment';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const getCookbook: AuthenticatedRequestHandler = async ({ request, requestEnv }) => {
  const cookbookRepository = await requestEnv.get('cookbookRepository');

  const { id } = getCookbookQuerySchema.parse(request.query);

  const cookbook = await cookbookRepository.get(id);

  return {
    jsonBody: cookbook
  };
};

app.http('getCookbook', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: createAuthenticatedRequestHandler(appEnvironment, getCookbook)
});

const getCookbookQuerySchema = zfd.formData({
  id: z.string().uuid(),
});
