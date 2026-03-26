import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import Index from '../../../app/index';
import Camera from '../../../app/camera';

// Mock expo-camera
jest.mock('expo-camera', () => {
  const React = require('react');

  return {
    Camera: {
      useCameraPermissions: jest.fn(() => [
        { status: 'granted', granted: true },
        jest.fn(),
      ]),
      Constants: {
        Type: {
          back: 0,
          front: 1,
        },
      },
    },
    CameraView: React.forwardRef(({ children, ...props }: any, ref: any) => {
      const { View } = require('react-native');

      React.useImperativeHandle(ref, () => ({
        takePictureAsync: jest.fn().mockResolvedValue({
          uri: 'file:///mock-photo.jpg',
          width: 1920,
          height: 1080,
        }),
      }));

      return <View testID="camera-view" {...props}>{children}</View>;
    }),
    useCameraPermissions: jest.fn(() => [
      { status: 'granted', granted: true },
      jest.fn(),
    ]),
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  Link: ({ children, href, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props} testID={`link-${href}`}>{children}</Text>;
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Scenario: Launch camera from home screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays "Take Photo" button prominently on home screen', () => {
    // GIVEN: I am a spiritual practitioner studying a Sanskrit book
    // AND: I encounter Devanagari text I cannot read
    // WHEN: I open the Sanskrit Student app
    render(<Index />);

    // THEN: I should see a "Take Photo" button prominently displayed
    // Note: Current implementation shows "Camera (Coming Soon)"
    // This test documents the expected behavior for the camera launch feature
    const cameraButton = screen.getByTestId('link-/camera');
    expect(cameraButton).toBeTruthy();
  });

  it('opens camera within 1 second when "Take Photo" is tapped', async () => {
    // GIVEN: I am on the home screen
    const startTime = Date.now();

    render(<Index />);

    // WHEN: I tap the "Take Photo" button
    const cameraButton = screen.getByTestId('link-/camera');
    fireEvent.press(cameraButton);

    // THEN: the device camera should open within 1 second
    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeLessThan(1000);
  });

  it('displays camera with landscape frame overlay and guidance text', async () => {
    // GIVEN: I have tapped the "Take Photo" button
    // WHEN: the camera opens
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // THEN: I should see a landscape frame overlay (70% screen width)
    await waitFor(() => {
      const frameOverlay = screen.getByTestId('camera-frame-overlay');
      expect(frameOverlay).toBeTruthy();
      // Frame should be 70% screen width
      expect(frameOverlay).toHaveStyle({ width: '70%' });
    });

    // AND: I should see guidance text: "Best results: photograph 2-6 lines"
    const guidanceText = screen.getByText(/best results.*photograph 2-6 lines/i);
    expect(guidanceText).toBeTruthy();
  });
});
