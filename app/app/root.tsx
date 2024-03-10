import { IconContext } from "@phosphor-icons/react";
import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node"; // or cloudflare/deno
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

import stylesheet from '~/styles/stylesheet.css?url';

export const links: LinksFunction = () => [
  ...(cssBundleHref
    ? [{ rel: "stylesheet", href: cssBundleHref }]
    : []),
  { rel: "stylesheet", href: stylesheet }
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
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

export default function App() {
  return <Outlet />;
}

export function HydrateFallback() {
  return <></>;
}
