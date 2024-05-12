import { app } from '@azure/functions';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { appContext } from '../../appContext';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const editCookbook: AuthenticatedRequestHandler = async ({ request, requestContext }) => {
  const cookbookRepository = await requestContext.cookbookRepository;

  const { id, title, authors } = editCookbookRequestBodySchema.parse(await request.formData());

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
  handler: createAuthenticatedRequestHandler(appContext, editCookbook)
});

const parseAuthors = (authors: string) => authors.split('\n')
  .map(author => author.trim())
  .filter(author => author.length > 0);

const editCookbookRequestBodySchema = zfd.formData({
  id: z.string().uuid(),
  title: zfd.text(),
  authors: zfd.text().transform(parseAuthors),
});
