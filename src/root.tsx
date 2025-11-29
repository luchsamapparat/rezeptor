import { QueryClientProvider } from '@tanstack/react-query';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import type { PropsWithChildren } from 'react';
import type { Route } from './+types/root';
import { getOrCreateQueryClient, provideQueryClient } from './application/client/queryClient';
import { ApplicationError } from './application/ui/ApplicationError';

export const meta: Route.MetaFunction = () => [
  { charSet: 'utf-8' },
  { name: 'viewport', content: 'initial-scale=1, viewport-fit=cover, width=device-width' },
  { name: 'apple-mobile-web-app-title', content: 'Rezeptor' },
  { name: 'apple-mobile-web-app-capable', content: 'yes' },
  { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
];

export const links: Route.LinksFunction = () => [
  { rel: 'manifest', href: 'manifest.json' },
  { rel: 'icon', href: 'icon.svg', type: 'image/svg+xml' },
  { rel: 'apple-touch-icon', href: 'ios/180.png' },
];

// <link rel="apple-touch-icon" href="./assets/icon-180.png">

export const middleware: Route.MiddlewareFunction[] = [async ({ context }, next) => {
  provideQueryClient(context, getOrCreateQueryClient());
  await next();
}];

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [async ({ context }, next) => {
  provideQueryClient(context, getOrCreateQueryClient());
  await next();
}];

export function Layout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
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
  return (
    <QueryClientProvider client={getOrCreateQueryClient()}>
      <Outlet />
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ApplicationError error={error} />;
}
