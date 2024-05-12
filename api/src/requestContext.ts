import type { HttpRequest } from '@azure/functions';
import { createContainer } from 'iti';
import type { AppContext } from './appContext';
import { getOwnership, toOwnershipProperties } from './auth/model';
import { getSessionFromRequest } from './auth/session';
import { createOwnedItemContainer } from './common/infrastructure/persistence/azureCosmosDb';
import { createFileContainer } from './common/infrastructure/persistence/azureStorageAccount';
import { CookbookRepository } from './recipes/infrastructure/persistence/CookbookRepository';
import { RecipeRepository } from './recipes/infrastructure/persistence/RecipeRepository';

export const createRequestContext = (request: HttpRequest, appContext: AppContext) => {
  return createContainer()
    .add({
      session: async () => getSessionFromRequest(
        await appContext.get('sessionRepository'),
        appContext.get('authenticationConfig'),
        request
      )
    })
    .add(ctx => ({
      ownership: async () => {
        const session = await ctx.session;

        if (session === null) {
          throw new Error('Failed to determine ownership properties. No session available.');
        }

        return getOwnership(session);
      }
    }))
    .add(ctx => ({
      cookbookRepository: async () => new CookbookRepository(
        await createOwnedItemContainer(
          await appContext.get('database'),
          'cookbook',
          toOwnershipProperties(await ctx.ownership),
          appContext.get('telemetry')
        )
      ),
      recipeRepository: async () => new RecipeRepository(
        await createOwnedItemContainer(
          await appContext.get('database'),
          'recipe',
          toOwnershipProperties(await ctx.ownership),
          appContext.get('telemetry')
        ),
        await createFileContainer(appContext.get('blobService'), 'recipe', await ctx.ownership),
        await createFileContainer(appContext.get('blobService'), 'photo', await ctx.ownership),
      ),
    }));
};

export type RequestContext = ReturnType<typeof createRequestContext>;
