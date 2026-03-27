import { HttpLink } from '@apollo/client';
import { ApolloClient, InMemoryCache } from '@apollo/experimental-nextjs-app-support';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

/**
 * Creates a new Apollo Client instance.
 * Called per-request on the server and once on the client.
 * Uses SSR-compatible ApolloClient and InMemoryCache from @apollo/experimental-nextjs-app-support.
 */
export function makeClient() {
  return new ApolloClient({
    link: new HttpLink({ uri: GRAPHQL_ENDPOINT }),
    cache: new InMemoryCache(),
  });
}
