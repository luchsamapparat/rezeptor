import { QueryClient } from '@tanstack/react-query';
import { isNull } from 'lodash-es';
import { createContext, type RouterContextProvider } from 'react-router';

const queryClientContext = createContext<QueryClient | null>(null);

export const provideQueryClient = (context: Readonly<RouterContextProvider>, queryClient: QueryClient) => {
  return context.set(queryClientContext, queryClient);
};

export const getQueryClient = (context: Readonly<RouterContextProvider>) => {
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