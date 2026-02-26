// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    PinchGestureHandler: View,
    State: {},
    Directions: {},
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    default: {
      View: View,
      createAnimatedComponent: (Component) => Component,
    },
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: (callback) => callback(),
    withTiming: (value) => value,
    withSpring: (value) => value,
    useAnimatedGestureHandler: () => ({}),
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));
