import { ClientActionFunctionArgs, redirect, useFetcher } from "@remix-run/react";
import { isNull } from "lodash-es";
import { isAuthenticated, isRegisteredClient, loginWithCookie, loginWithInvitationCode } from "~/infrastructure/authentication";

export async function clientLoader() {
    if (isAuthenticated()) {
        return redirect('/');
    }

    return null;
}

export async function clientAction({ request }: ClientActionFunctionArgs) {
    const formData = await request.formData();

    if (isRegisteredClient()) {
        await loginWithCookie();
        return null;
    }

    const invitationCode = formData.get('invitationCode') as string | null;

    if (!isNull(invitationCode)) {
        await loginWithInvitationCode(invitationCode);
        return null;
    }

    throw new Error(`invitation code or group cookie required to login`);
}

export default function Login() {
    const fetcher = useFetcher();

    return (
        <fetcher.Form method="post">
            {isRegisteredClient() ? null : (
                <input type="text" name="invitationCode" defaultValue="HHL1635" />
            )}

            <button type="submit" name="action" value="login">Anmelden</button>
        </fetcher.Form>
    )
}
