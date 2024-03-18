import { CaretLeft } from "@phosphor-icons/react";
import { ClientActionFunctionArgs, Link, redirect, useFetcher } from "@remix-run/react";
import { FormEvent } from "react";
import { authenticatedFetch } from "~/infrastructure/fetch";

export async function clientAction({ request }: ClientActionFunctionArgs) {
    const response = await authenticatedFetch(`/addCookbook`, {
        method: 'post',
        body: await request.formData()
    });
    const id = await response.text();
    return redirect(`/cookbooks/edit/${id}`);
}

export default function NewCookbook() {
    const fetcher = useFetcher();
    const submitting = fetcher.state === 'submitting';

    const handleChange = (event: FormEvent<HTMLInputElement>) => event.currentTarget.form?.requestSubmit();

    return (<>
        <Link to="/"><CaretLeft /> zurück</Link>
        <main>
            <fetcher.Form method="post" encType="multipart/form-data">
                <fieldset disabled={submitting}>
                    <label>
                        Buchrücken (mit Barcode)
                        <input type="file" name="backCoverFile" accept="image/*" capture="environment" onChange={handleChange} required />
                    </label>
                    <button type="submit">Hinzufügen</button>
                </fieldset>
            </fetcher.Form>
        </main>
    </>);
}
