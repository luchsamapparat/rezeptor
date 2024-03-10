import { CaretLeft } from "@phosphor-icons/react";
import { ClientActionFunctionArgs, Link, redirect, useFetcher, useLoaderData } from "@remix-run/react";
import { FormEvent } from "react";
import { fetch } from "~/infrastructure/fetch";
import { Cookbook } from "~/model";

export async function clientLoader() {
    const response = await fetch(`/getCookbooks`);
    return response.json() as Promise<Cookbook[]>;
}

export async function clientAction({ request }: ClientActionFunctionArgs) {
    const response = await fetch(`/addRecipe`, {
        method: 'post',
        body: await request.formData()
    });
    const id = await response.text();
    return redirect(`/recipes/edit/${id}`);
}

export default function NewRecipe() {
    const cookbooks = useLoaderData<typeof clientLoader>();

    const fetcher = useFetcher();
    const submitting = fetcher.state === 'submitting';

    const handleChange = (event: FormEvent<HTMLInputElement>) => event.currentTarget.form?.requestSubmit();

    return (<>
        <Link to="/"><CaretLeft /> zurück</Link>
        <main>
            <fetcher.Form method="post" encType="multipart/form-data">
                <fieldset disabled={submitting}>
                    <label>
                        Cookbook
                        <select name="cookbookId">
                            {cookbooks.map(cookbook => (
                                <option value={cookbook.id} key={cookbook.id}>{cookbook.title}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Recipe
                        <input type="file" name="recipeFile" accept="image/*" capture="environment" onChange={handleChange} required />
                    </label>
                    <button type="submit">Hinzufügen</button>
                </fieldset>
            </fetcher.Form>
        </main>
    </>);
}
