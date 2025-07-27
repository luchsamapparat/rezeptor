import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import type { PropsWithChildren } from 'react';
import type { Route } from './+types/root';
import { ApplicationError } from './application/ui/ApplicationError';

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ApplicationError error={error} />;
}
