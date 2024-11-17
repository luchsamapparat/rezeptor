import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { ClientActionFunctionArgs, Link, redirect, useFetcher, useParams } from "@remix-run/react";
import { FormEvent } from "react";
import { authenticatedFetch } from "~/infrastructure/fetch";

export async function clientAction({ request }: ClientActionFunctionArgs) {
    await authenticatedFetch(`/replaceRecipePhoto`, {
        method: 'post',
        body: await request.formData()
    });
    return redirect(`/`);
}

export default function ReplaceRecipePhoto() {
    const params = useParams();

    const fetcher = useFetcher();
    const submitting = fetcher.state === 'submitting';

    const handleChange = (event: FormEvent<HTMLInputElement>) => event.currentTarget.form?.requestSubmit();

    return (<>
        <Link to="/"><CaretLeft /> zurück</Link>
        <main>
            <fetcher.Form method="post" encType="multipart/form-data">
                <fieldset disabled={submitting}>
                    <input type="hidden" name="id" defaultValue={params.id} />
                    <label>
                        Titel
                        <input type="file" name="photoFile" accept="image/*" onChange={handleChange} />
                    </label>
                    <button type="submit">Speichern</button>
                </fieldset>
            </fetcher.Form>
            <Link to="/">überspringen <CaretRight /> </Link>
        </main>
    </>);
}
