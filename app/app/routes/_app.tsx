import { Outlet, redirect, useFetcher } from "@remix-run/react";
import { isAuthenticated } from "~/infrastructure/authentication";

export async function clientLoader() {
    if (!isAuthenticated()) {
        return redirect('/login');
    }

    return null;
}

export default function App() {
    const fetcher = useFetcher();

    return (<>
        {isAuthenticated() ? (<>
            <fetcher.Form method="post" action="/logout">
                <button type="submit" name="action" value="logout">Abmelden</button>
            </fetcher.Form>
        </>) : null}
        <Outlet />
    </>);
}
