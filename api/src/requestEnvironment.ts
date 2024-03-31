import { HttpRequest } from "@azure/functions";
import { createContainer } from "iti";
import { AppEnvironment } from "./appEnvironment";
import { getOwnership } from "./auth/model";
import { getSessionFromRequest } from "./auth/session";
import { createOwnedItemContainer } from "./common/infrastructure/persistence/azureCosmosDb";
import { FileContainer, createBlobContainerClient } from "./common/infrastructure/persistence/azureStorageAccount";
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
                    await ctx.ownership,
                    appEnvironment.get('telemetry')
                )
            ),
            recipeRepository: async () => new RecipeRepository(
                await createOwnedItemContainer(
                    await appEnvironment.get('database'),
                    'recipe',
                    await ctx.ownership,
                    appEnvironment.get('telemetry')
                ),
                new FileContainer(await createBlobContainerClient(appEnvironment.get('blobService'), 'recipe')),
                new FileContainer(await createBlobContainerClient(appEnvironment.get('blobService'), 'photo')),
            ),
        }));
}

export type RequestEnvironment = ReturnType<typeof createRequestEnvironment>;
