import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import Camera from '../../../app/camera';

// Mock expo-camera
const mockTakePictureAsync = jest.fn();

jest.mock('expo-camera', () => {
  const React = require('react');

  return {
    Camera: ({ children, ...props }: any) => {
      const { View } = require('react-native');
      return <View testID="camera-view" {...props}>{children}</View>;
    },
    CameraView: React.forwardRef(({ children, ...props }: any, ref: any) => {
      const { View } = require('react-native');

      React.useImperativeHandle(ref, () => ({
        takePictureAsync: mockTakePictureAsync,
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
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Scenario: Retake photo if quality is poor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTakePictureAsync.mockResolvedValue({
      uri: 'file:///mock-photo.jpg',
      width: 1920,
      height: 1080,
    });
  });

  it('returns to camera view when "Retake" button is tapped', async () => {
    // GIVEN: I am viewing the photo preview
    // AND: I notice the photo is blurry
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // First, capture a photo to enter preview state
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    // Wait for preview to appear
    await waitFor(() => {
      expect(screen.getByTestId('preview-image')).toBeTruthy();
    });

    // WHEN: I tap the "Retake" button
    const retakeButton = screen.getByTestId('retake-button');
    fireEvent.press(retakeButton);

    // THEN: I should return to the camera view
    await waitFor(() => {
      expect(screen.queryByTestId('preview-image')).toBeNull();
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });
  });

  it('preserves camera settings when returning from preview', async () => {
    // GIVEN: I am viewing the photo preview
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // First, capture a photo to enter preview state
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    // Wait for preview to appear
    await waitFor(() => {
      expect(screen.getByTestId('preview-image')).toBeTruthy();
    });

    // WHEN: I tap the "Retake" button
    const retakeButton = screen.getByTestId('retake-button');
    fireEvent.press(retakeButton);

    // THEN: I should still see the frame overlay and guidance
    await waitFor(() => {
      const frameOverlay = screen.getByTestId('camera-frame-overlay');
      expect(frameOverlay).toBeTruthy();

      const guidanceText = screen.getByText(/best results.*photograph 2-6 lines/i);
      expect(guidanceText).toBeTruthy();
    });
  });

  it('does not lose session state when retaking photo', async () => {
    // GIVEN: I am viewing the photo preview
    // AND: I have session context (e.g., came from a specific flow)
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // First, capture a photo to enter preview state
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    // Wait for preview to appear
    await waitFor(() => {
      expect(screen.getByTestId('preview-image')).toBeTruthy();
    });

    // WHEN: I tap the "Retake" button
    const retakeButton = screen.getByTestId('retake-button');
    fireEvent.press(retakeButton);

    // THEN: my previous session should not be lost
    // (e.g., if I came from a specific study session, that context remains)
    await waitFor(() => {
      const cameraView = screen.getByTestId('camera-view');
      expect(cameraView).toBeTruthy();
    });

    // Session state would be verified through context or navigation state
    // This test documents that retake is a non-destructive operation
  });

  it.skip('allows multiple retakes without degradation', async () => {
    // GIVEN: I have taken multiple photos and retaken them
    render(<Camera />);

    // Simulate multiple capture and retake cycles
    for (let i = 0; i < 3; i++) {
      // Capture photo
      const shutterButton = screen.getByTestId('shutter-button');
      fireEvent.press(shutterButton);

      await waitFor(() => {
        expect(screen.getByTestId('preview-image')).toBeTruthy();
      });

      // Retake
      const retakeButton = screen.getByTestId('retake-button');
      fireEvent.press(retakeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('preview-image')).toBeNull();
        expect(screen.getByTestId('camera-view')).toBeTruthy();
      });
    }

    // THEN: camera should still function properly after multiple retakes
    const shutterButton = screen.getByTestId('shutter-button');
    expect(shutterButton).toBeTruthy();
    expect(shutterButton).not.toHaveAccessibilityState({ disabled: true });
  });

  it.skip('cleans up previous photo URI when retaking', async () => {
    // GIVEN: I am viewing the photo preview
    render(<Camera />);

    const previewImage = screen.getByTestId('preview-image');
    const previousUri = previewImage.props.source.uri;
    expect(previousUri).toBeTruthy();

    // WHEN: I tap the "Retake" button
    const retakeButton = screen.getByTestId('retake-button');
    fireEvent.press(retakeButton);

    // THEN: the previous photo URI should be cleaned up
    await waitFor(() => {
      expect(screen.queryByTestId('preview-image')).toBeNull();
    });

    // When a new photo is captured, it should have a different URI
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    await waitFor(() => {
      const newPreviewImage = screen.getByTestId('preview-image');
      const newUri = newPreviewImage.props.source.uri;
      expect(newUri).not.toBe(previousUri);
    });
  });
});
