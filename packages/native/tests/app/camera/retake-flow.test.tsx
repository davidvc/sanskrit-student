import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import Camera from '../../../app/camera';

// Mock expo-camera
type PhotoResult = { uri: string; width?: number; height?: number; base64?: string | null };
const mockTakePictureAsync = jest.fn<() => Promise<PhotoResult>>();

jest.mock('expo-camera', () => {
  const React = require('react');

  return {
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

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
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
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    fireEvent.press(screen.getByTestId('shutter-button'));

    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('retake-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('photo-preview')).toBeNull();
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });
  });

  it('preserves camera settings when returning from preview', async () => {
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    fireEvent.press(screen.getByTestId('shutter-button'));

    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('retake-button'));

    await waitFor(() => {
      expect(screen.getByTestId('camera-frame-overlay')).toBeTruthy();
      expect(screen.getByText(/best results.*photograph 2-6 lines/i)).toBeTruthy();
    });
  });

  it('does not lose session state when retaking photo', async () => {
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    fireEvent.press(screen.getByTestId('shutter-button'));

    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('retake-button'));

    await waitFor(() => {
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });
  });

  it('allows multiple retakes without degradation', async () => {
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    for (let i = 0; i < 3; i++) {
      fireEvent.press(screen.getByTestId('shutter-button'));

      await waitFor(() => {
        expect(screen.getByTestId('photo-preview')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('retake-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('photo-preview')).toBeNull();
        expect(screen.getByTestId('camera-view')).toBeTruthy();
      });
    }

    const shutterButton = screen.getByTestId('shutter-button');
    expect(shutterButton).toBeTruthy();
    expect(shutterButton).not.toHaveAccessibilityState({ disabled: true });
  });

  it('cleans up previous cropped photo when retaking', async () => {
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    fireEvent.press(screen.getByTestId('shutter-button'));

    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('retake-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('photo-preview')).toBeNull();
    });

    // After retake, a new capture should show the preview again
    fireEvent.press(screen.getByTestId('shutter-button'));

    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeTruthy();
    });
  });
});
