import { HttpRequest } from "@azure/functions";
import { createContainer } from "iti";
import { AppEnvironment } from "./appEnvironment";
import { getOwnership, toOwnershipProperties } from "./auth/model";
import { getSessionFromRequest } from "./auth/session";
import { createOwnedItemContainer } from "./common/infrastructure/persistence/azureCosmosDb";
import { createFileContainer } from "./common/infrastructure/persistence/azureStorageAccount";
import { CookbookRepository } from "./recipes/infrastructure/persistence/CookbookRepository";
import { RecipeRepository } from "./recipes/infrastructure/persistence/RecipeRepository";

export const createRequestEnvironment = (request: HttpRequest, appEnvironment: AppEnvironment) => {
    return createContainer()
        .add({
            session: async () => getSessionFromRequest(
                await appEnvironment.get('sessionRepository'),
                appEnvironment.get('authenticationConfig'),
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
                    await appEnvironment.get('database'),
                    'cookbook',
                    toOwnershipProperties(await ctx.ownership),
                    appEnvironment.get('telemetry')
                )
            ),
            recipeRepository: async () => new RecipeRepository(
                await createOwnedItemContainer(
                    await appEnvironment.get('database'),
                    'recipe',
                    toOwnershipProperties(await ctx.ownership),
                    appEnvironment.get('telemetry')
                ),
                await createFileContainer(appEnvironment.get('blobService'), 'recipe', await ctx.ownership),
                await createFileContainer(appEnvironment.get('blobService'), 'photo', await ctx.ownership),
            ),
        }));
}

export type RequestEnvironment = ReturnType<typeof createRequestEnvironment>;
