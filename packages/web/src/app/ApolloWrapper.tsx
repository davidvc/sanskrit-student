'use client';

import { ApolloProvider } from '@apollo/client';
import { useMemo } from 'react';
import { createApolloClient } from '@/lib/apollo-client';

/**
 * Client-side Apollo Provider wrapper for the Next.js App Router.
 * All pages that use Apollo hooks must be descendants of this component.
 */
export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => createApolloClient(), []);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
