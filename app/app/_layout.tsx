import { Stack } from 'expo-router';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '../lib/apollo';

export default function RootLayout() {
  return (
    <ApolloProvider client={apolloClient}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Sanskrit Student' }} />
        <Stack.Screen name="translate" options={{ title: 'Translate' }} />
        <Stack.Screen name="camera" options={{ title: 'Camera' }} />
        <Stack.Screen name="history" options={{ title: 'History' }} />
      </Stack>
    </ApolloProvider>
  );
}
