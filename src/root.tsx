import { QueryClientProvider } from '@tanstack/react-query';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import type { PropsWithChildren } from 'react';
import type { Route } from './+types/root';
import './app.css';
import { getOrCreateQueryClient, provideQueryClient } from './application/client/queryClient';
import { ApplicationError } from './application/ui/ApplicationError';

export const links: Route.LinksFunction = () => [];

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
  return (
    <QueryClientProvider client={getOrCreateQueryClient()}>
      <Outlet />
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ApplicationError error={error} />;
}
