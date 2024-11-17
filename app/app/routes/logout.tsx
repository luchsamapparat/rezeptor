import { ClientActionFunctionArgs, redirect } from "@remix-run/react";
import { logout } from "~/infrastructure/authentication";

export async function clientAction({ request }: ClientActionFunctionArgs) {
    const formData = await request.formData();

    if (formData.get('action') === 'logout') {
        await logout();
        return redirect('/login');
    }

    return redirect('/');
}