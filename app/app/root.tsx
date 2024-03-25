import { IconContext } from "@phosphor-icons/react";
import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node"; // or cloudflare/deno
import { ClientActionFunctionArgs, Links, Meta, Outlet, Scripts, ScrollRestoration, useFetcher } from "@remix-run/react";

import { isNull } from "lodash-es";
import stylesheet from '~/styles/stylesheet.css?url';
import { isAuthenticated, isRegisteredClient, loginWithCookie, loginWithInvitationCode, logout } from "./infrastructure/authentication";

export const links: LinksFunction = () => [
  ...(cssBundleHref
    ? [{ rel: "stylesheet", href: cssBundleHref }]
    : []),
  { rel: "stylesheet", href: stylesheet }
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <title>Rezeptor</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link rel="manifest" href="manifest.json" />
      </head>
      <body>
        <IconContext.Provider value={{
          color: 'currentColor',
          size: '1em',
          weight: 'regular',
          mirrored: false,
          className: 'icon'
        }}>
          {children}
        </IconContext.Provider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html >
  );
}

export async function clientAction({ request }: ClientActionFunctionArgs) {
  const formData = await request.formData();

  if (formData.get('action') === 'login') {
    if (isRegisteredClient()) {
      await loginWithCookie();
      return null;
    }

    const invitationCode = formData.get('invitationCode') as string | null;

    if (!isNull(invitationCode)) {
      await loginWithInvitationCode(invitationCode);
      return null;
    }

    throw new Error(`invitation code or group cookie required to login`)
  }

  if (formData.get('action') === 'logout') {
    await logout();
    return null;
  }
}

export default function App() {
  const fetcher = useFetcher();

  return (<>
    {isAuthenticated() ? (<>
      <fetcher.Form method="post">
        <button type="submit" name="action" value="logout">Abmelden</button>
      </fetcher.Form>
      <Outlet />
    </>) : (<>
      <fetcher.Form method="post">
        {isRegisteredClient() ? null : (
          <input type="text" name="invitationCode" defaultValue="HHL1635" />
        )}

        <button type="submit" name="action" value="login">Anmelden</button>
      </fetcher.Form>
    </>)}
  </>);
}

export function HydrateFallback() {
  return <></>;
}
