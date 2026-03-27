'use client';

import { ApolloNextAppProvider } from '@apollo/experimental-nextjs-app-support';
import { makeClient } from '@/lib/apollo-client';

/**
 * Apollo Provider wrapper for the Next.js App Router.
 * Uses ApolloNextAppProvider for SSR-compatible hydration.
 * All pages that use Apollo hooks must be descendants of this component.
 */
export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
