import { ApolloClient, InMemoryCache } from '@apollo/client';
import Constants from 'expo-constants';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createUploadLink = require('apollo-upload-client/createUploadLink.mjs').default;

/**
 * Recognizes both standard Web API File/Blob instances and React Native
 * URI-based file objects ({ uri, name, type }) as extractable files for
 * apollo-upload-client's multipart upload.
 */
function isExtractableFile(value: unknown): boolean {
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true;
  if (typeof File !== 'undefined' && value instanceof File) return true;
  const obj = value as Record<string, unknown>;
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.uri === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string'
  );
}

// Determine the GraphQL endpoint based on environment
const getGraphQLUri = () => {
  // In production (deployed to Vercel), use relative path on same domain
  if (process.env.NODE_ENV === 'production') {
    return '/graphql';
  }

  // In development, derive host from Expo's Metro bundler host so physical
  // devices and simulators can reach the server (localhost won't work on device).
  const expoHost = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${expoHost}:4000/graphql`;
};

export const apolloClient = new ApolloClient({
  link: createUploadLink({ uri: getGraphQLUri(), isExtractableFile }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          translateText: {
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
