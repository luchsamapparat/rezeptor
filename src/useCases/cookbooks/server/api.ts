import { Router } from 'express';

import { z } from 'zod';
import { validateRequest, type TypedRequest } from '~/application/server/validation';
import { cookbooksContext } from './context';

const requestBodySchema = z.object({ foo: z.string() });

export const cookbooksApi = Router();

cookbooksApi.use(cookbooksContext.middleware);

cookbooksApi
  .route('/cookbooks')
  .get(
    validateRequest({ requestBodySchema }),
    async (request: TypedRequest<typeof requestBodySchema>, response) => {
      console.log(request.body.foo);

      const { database } = cookbooksContext.get();

      const allCookbooks = await database.query.cookbooks.findMany();

      response.json(allCookbooks);
    });
