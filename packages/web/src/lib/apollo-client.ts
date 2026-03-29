// eslint-disable-next-line @typescript-eslint/no-require-imports
const createUploadLink = require('apollo-upload-client/createUploadLink.mjs').default;
import { ApolloClient, InMemoryCache } from '@apollo/experimental-nextjs-app-support';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

/**
 * Creates a new Apollo Client instance.
 * Called per-request on the server and once on the client.
 * Uses SSR-compatible ApolloClient and InMemoryCache from @apollo/experimental-nextjs-app-support.
 * Uses createUploadLink to support multipart file uploads (e.g. OCR image upload).
 */
export function makeClient() {
  return new ApolloClient({
    link: createUploadLink({ uri: GRAPHQL_ENDPOINT }),
    cache: new InMemoryCache(),
  });
}
