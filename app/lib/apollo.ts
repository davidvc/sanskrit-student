import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Determine the GraphQL endpoint based on environment
const getGraphQLUri = () => {
  // In production (deployed to Vercel), use relative path on same domain
  if (process.env.NODE_ENV === 'production') {
    return '/graphql';
  }

  // In development, use local server
  return 'http://localhost:4000/graphql';
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
