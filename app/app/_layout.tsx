import { Stack } from 'expo-router';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '../lib/apollo';

export default function RootLayout() {
  return (
    <ApolloProvider client={apolloClient}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Sanskrit Student' }} />
      </Stack>
    </ApolloProvider>
  );
}
