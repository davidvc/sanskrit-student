import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import Constants from 'expo-constants';

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

const httpLink = new HttpLink({
  uri: getGraphQLUri(),
});

export const apolloClient = new ApolloClient({
  link: httpLink,
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
