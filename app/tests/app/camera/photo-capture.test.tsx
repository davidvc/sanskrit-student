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

describe('Scenario: Capture photo with manual shutter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTakePictureAsync.mockResolvedValue({
      uri: 'file:///mock-photo.jpg',
      width: 1920,
      height: 1080,
      base64: null,
    });
  });

  it('captures photo when shutter button is tapped', async () => {
    // GIVEN: the camera is open
    // AND: I have positioned my phone over a 4-line Devanagari sutra
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    const cameraView = screen.getByTestId('camera-view');
    expect(cameraView).toBeTruthy();

    // WHEN: I tap the shutter button
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    // THEN: a photo should be captured
    await waitFor(() => {
      expect(mockTakePictureAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('shows preview immediately after photo is captured', async () => {
    // GIVEN: the camera is open
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // WHEN: I tap the shutter button
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    // THEN: I should immediately see a preview of the captured photo
    await waitFor(() => {
      const photoPreview = screen.getByTestId('photo-preview');
      expect(photoPreview).toBeTruthy();
    });

    // AND: the preview should show the captured image
    const previewImage = screen.getByTestId('preview-image');
    expect(previewImage).toHaveProp('source', { uri: 'file:///mock-photo.jpg' });
  });

  it.skip('disables shutter button during capture to prevent double-tap', async () => {
    // GIVEN: the camera is open
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    const shutterButton = screen.getByTestId('shutter-button');

    // WHEN: I tap the shutter button
    fireEvent.press(shutterButton);

    // THEN: the shutter button should be disabled during capture
    await waitFor(() => {
      expect(shutterButton).toHaveAccessibilityState({ disabled: true });
    });

    // AND: after capture completes, button state is managed by preview transition
    await waitFor(() => {
      const photoPreview = screen.getByTestId('photo-preview');
      expect(photoPreview).toBeTruthy();
    });
  });
});
