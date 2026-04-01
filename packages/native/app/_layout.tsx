import { Stack } from 'expo-router';
import { ApolloProvider } from '@apollo/client';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { apolloClient } from '../lib/apollo';

// Suppress the LogBox notification overlay in development so it doesn't
// intercept touches during E2E testing.
if (__DEV__) {
  LogBox.ignoreAllLogs();
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ApolloProvider client={apolloClient}>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Sanskrit Student' }} />
          <Stack.Screen name="translate" options={{ title: 'Translate' }} />
          <Stack.Screen name="camera" options={{ title: 'Camera' }} />
          <Stack.Screen name="history" options={{ title: 'History' }} />
        </Stack>
      </ApolloProvider>
    </GestureHandlerRootView>
  );
}
