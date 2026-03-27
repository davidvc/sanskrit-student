import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

export function createApolloClient() {
  return new ApolloClient({
    link: new HttpLink({ uri: GRAPHQL_ENDPOINT }),
    cache: new InMemoryCache(),
  });
}
