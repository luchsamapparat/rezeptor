import { QueryClient } from '@tanstack/react-query';
import { isNull } from 'lodash-es';
import { unstable_createContext, unstable_RouterContextProvider } from 'react-router';

const queryClientContext = unstable_createContext<QueryClient | null>(null);

export const provideQueryClient = (context: Readonly<unstable_RouterContextProvider>, queryClient: QueryClient) => {
  return context.set(queryClientContext, queryClient);
};

export const getQueryClient = (context: Readonly<unstable_RouterContextProvider>) => {
  const queryClient = context.get(queryClientContext);

  if (isNull(queryClient)) {
    throw new Error('No query client provided.');
  }

  return queryClient;
};

let clientQueryClient: QueryClient | null = null;

export const getOrCreateQueryClient = () => {
  if (import.meta.env.SSR) {
    return new QueryClient();
  }

  if (isNull(clientQueryClient)) {
    clientQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 10000,
        },
      },
    });
  }

  return clientQueryClient;
};