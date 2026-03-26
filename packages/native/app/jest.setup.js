// Jest setup for React Native testing
// This file configures mocks for React Native libraries that require native modules

// Mock expo-camera
jest.mock('expo-camera', () => {
  const React = require('react');
  return {
    CameraView: ({ children, ...props }) => {
      return React.createElement('CameraView', props, children);
    },
    useCameraPermissions: () => [
      { granted: true, status: 'granted' },
      jest.fn(),
    ],
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Link: ({ children, ...props }) => {
    const React = require('react');
    return React.createElement('Link', props, children);
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Apollo Client
jest.mock('@apollo/client', () => {
  const actualApollo = jest.requireActual('@apollo/client');
  return {
    ...actualApollo,
    useQuery: jest.fn(),
    useMutation: jest.fn(() => [jest.fn(), { loading: false, error: null }]),
    ApolloProvider: ({ children }) => children,
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // The mock for call immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};

  return {
    ...Reanimated,
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: (cb) => cb(),
    useAnimatedGestureHandler: (handlers) => handlers,
    withTiming: (value) => value,
    withSpring: (value) => value,
  };
});

// Silence the warning: Animated: useNativeDriver is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    GestureHandlerRootView: View,
    PinchGestureHandler: View,
    State: {
      BEGAN: 0,
      FAILED: 1,
      ACTIVE: 2,
      END: 3,
      UNDETERMINED: 4,
    },
    Directions: {},
  };
});
