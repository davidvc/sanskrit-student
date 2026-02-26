// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Image } = require('react-native');

  return {
    __esModule: true,
    default: {
      View: View,
      Image: Image,
      createAnimatedComponent: (Component) => Component,
    },
    useSharedValue: (val) => ({ value: val }),
    useAnimatedStyle: (fn) => ({ }),
    withTiming: (val) => val,
    useAnimatedGestureHandler: (handlers) => handlers,
    runOnJS: (fn) => fn,
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: ({ children, ...props }) => <View {...props}>{children}</View>,
    PinchGestureHandler: ({ children, onGestureEvent, ...props }) => {
      return (
        <View
          {...props}
          onPinchGestureEvent={onGestureEvent}
        >
          {children}
        </View>
      );
    },
    State: {},
  };
});

// Mock async-storage (for first-use-lighting-tip test)
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}), { virtual: true });
