// Jest setup for React Native testing
require('@testing-library/jest-native/extend-expect');

// Mock expo-camera
jest.mock('expo-camera', () => {
  const View = require('react-native').View;
  return {
    CameraView: View,
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
  Link: ({ children }) => children,
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-reanimated - simplified version without requiring the package
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Image, ScrollView } = require('react-native');

  // Create a simple Animated namespace that mocks the needed components
  const Animated = {
    View: View,
    Image: Image,
    ScrollView: ScrollView,
  };

  return {
    default: {
      ...Animated,
      createAnimatedComponent: (Component) => Component,
    },
    ...Animated,  // Export Animated.View, Animated.Image, etc. directly
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    useAnimatedGestureHandler: () => ({}),
    withTiming: (value) => value,
    withSpring: (value) => value,
    Easing: {},
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
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
