import { CaretLeft } from "@phosphor-icons/react";
import { ClientActionFunctionArgs, ClientLoaderFunctionArgs, Link, redirect, useFetcher, useLoaderData } from "@remix-run/react";
import { isUndefined } from "lodash-es";
import { authenticatedFetch } from "~/infrastructure/fetch";
import { Cookbook } from "~/model";

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
    const id = params.id;

    if (isUndefined(id)) {
        throw new Response(null, {
            status: 404,
        });
    }

    const response = await authenticatedFetch(`/getCookbook?id=${id}`);
    return response.json() as Promise<Cookbook>;
}

export async function clientAction({ request }: ClientActionFunctionArgs) {
    await authenticatedFetch(`/editCookbook`, {
        method: 'post',
        body: await request.formData()
    });
    return redirect(`/cookbooks`);
}

export default function EditCookbook() {
    const cookbook = useLoaderData<typeof clientLoader>();

    const fetcher = useFetcher();
    const submitting = fetcher.state === 'submitting';

    return (<>
        <Link to="/"><CaretLeft /> zurück</Link>
        <main>
            <fetcher.Form method="post">
                <fieldset disabled={submitting}>
                    <input type="hidden" name="id" defaultValue={cookbook.id} />
                    <label>
                        Titel
                        <input type="text" name="title" defaultValue={cookbook.title} required />
                    </label>
                    <label>
                        Autoren
                        <textarea name="authors" defaultValue={cookbook.authors.join('\n')} />
                    </label>
                    <button type="submit">Speichern</button>
                </fieldset>
            </fetcher.Form>
        </main>
    </>);
}
