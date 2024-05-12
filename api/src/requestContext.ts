import type { HttpRequest } from '@azure/functions';
import { createContainer } from 'iti';
import type { AppContext } from './appContext';
import { getOwnership, toOwnershipProperties } from './auth/model';
import { getSessionFromRequest } from './auth/session';
import { createOwnedItemContainer } from './common/infrastructure/persistence/azureCosmosDb';
import { createFileContainer } from './common/infrastructure/persistence/azureStorageAccount';
import { CookbookRepository } from './recipes/infrastructure/persistence/CookbookRepository';
import { RecipeRepository } from './recipes/infrastructure/persistence/RecipeRepository';

export const createRequestContext = (
  request: HttpRequest,
  {
    authenticationConfig,
    blobService,
    database,
    sessionRepository,
    telemetry,
  }: AppContext
) => {
  const requestContainer = createContainer()
    .add({
      session: async () => getSessionFromRequest(
        await sessionRepository,
        authenticationConfig,
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
          await database,
          'cookbook',
          toOwnershipProperties(await ctx.ownership),
          telemetry
        )
      ),
      recipeRepository: async () => new RecipeRepository(
        await createOwnedItemContainer(
          await database,
          'recipe',
          toOwnershipProperties(await ctx.ownership),
          telemetry
        ),
        await createFileContainer(blobService, 'recipe', await ctx.ownership),
        await createFileContainer(blobService, 'photo', await ctx.ownership),
      ),
    }));

  return requestContainer.items;
};

export type RequestContext = ReturnType<typeof createRequestContext>;
