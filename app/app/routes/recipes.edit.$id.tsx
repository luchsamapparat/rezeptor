import { CaretLeft } from "@phosphor-icons/react";
import { ClientActionFunctionArgs, ClientLoaderFunctionArgs, Link, redirect, useFetcher, useLoaderData } from "@remix-run/react";
import { isUndefined } from "lodash-es";
import { authenticatedFetch } from "~/infrastructure/fetch";
import { Recipe } from "~/model";

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
    const id = params.id;

    if (isUndefined(id)) {
        throw new Response(null, {
            status: 404,
        });
    }

    const response = await authenticatedFetch(`/getRecipe?id=${id}`);
    return response.json() as Promise<Recipe>;
}

export async function clientAction({ request, params }: ClientActionFunctionArgs) {
    const id = params.id;

    if (isUndefined(id)) {
        throw new Response(null, {
            status: 404,
        });
    }

    await authenticatedFetch(`/editRecipe`, {
        method: 'post',
        body: await request.formData()
    });
    return redirect(`/recipes/replacePhoto/${id}`);
}

export default function EditRecipe() {
    const recipe = useLoaderData<typeof clientLoader>();

    const fetcher = useFetcher();
    const submitting = fetcher.state === 'submitting';

    return (<>
        <Link to="/"><CaretLeft /> zurück</Link>
        <main>
            <fetcher.Form method="post">
                <fieldset disabled={submitting}>
                    <input type="hidden" name="id" defaultValue={recipe.id} />
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
