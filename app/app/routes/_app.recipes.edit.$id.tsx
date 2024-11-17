import { CaretLeft } from "@phosphor-icons/react";
import { ClientActionFunctionArgs, ClientLoaderFunctionArgs, Link, redirect, useFetcher, useLoaderData } from "@remix-run/react";
import { isUndefined } from "lodash-es";
import { getApiBaseUrl } from "~/environment";
import { authenticatedFetch } from "~/infrastructure/fetch";
import { Cookbook, RecipeDto, toRecipe } from "~/model";

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
    const id = params.id;

    if (isUndefined(id)) {
        throw new Response(null, {
            status: 404,
        });
    }

    const [recipeDto, cookbooks] = await Promise.all([
        authenticatedFetch(`/getRecipe?id=${id}`)
            .then(response => response.json() as Promise<RecipeDto>),

        authenticatedFetch(`/getCookbooks`)
            .then(response => response.json() as Promise<Cookbook[]>)
    ]);

    const recipe = toRecipe(cookbooks, getApiBaseUrl(), recipeDto);

    return {
        recipe,
        cookbooks
    };
}

export async function clientAction({ request, params }: ClientActionFunctionArgs) {
    const id = params.id;

    const redirectTo = new URL(request.url).searchParams.get('redirectTo') ?? '/';

    if (isUndefined(id)) {
        throw new Response(null, {
            status: 404,
        });
    }

    await authenticatedFetch(`/editRecipe`, {
        method: 'post',
        body: await request.formData()
    });
    return redirect(redirectTo);
}

export default function EditRecipe() {
    const { cookbooks, recipe } = useLoaderData<typeof clientLoader>();

    const fetcher = useFetcher();
    const submitting = fetcher.state === 'submitting';

    return (<>
        <Link to="/"><CaretLeft /> zurück</Link>
        <main>
            <fetcher.Form method="post">
                <fieldset disabled={submitting}>
                    <input type="hidden" name="id" defaultValue={recipe.id} />
                    <label>
                        Kochbuch
                        <select name="cookbookId">
                            {cookbooks.map(cookbook => (
                                <option value={cookbook.id} key={cookbook.id} selected={cookbook.id === recipe.cookbook.id}>{cookbook.title}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Titel
                        <input type="text" name="title" defaultValue={recipe.title} required />
                    </label>
                    <label>
                        Seite
                        <input type="number" name="pageNumber" defaultValue={recipe.pageNumber ?? ''} required />
                    </label>
                    <button type="submit">Speichern</button>
                </fieldset>
            </fetcher.Form>
        </main>
    </>);
}
