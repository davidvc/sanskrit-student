import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import Camera from '../../../app/camera';

jest.mock('react-native-image-crop-picker', () => ({
  __esModule: true,
  default: { openCropper: jest.fn() },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: mockImageCropPicker } = require('react-native-image-crop-picker') as {
  default: { openCropper: jest.Mock }
};

jest.mock('expo-camera', () => {
  const React = require('react');
  return {
    CameraView: React.forwardRef(({ children, ...props }: any, ref: any) => {
      const { View } = require('react-native');
      React.useImperativeHandle(ref, () => ({
        takePictureAsync: jest.fn(async () => ({
          uri: 'file:///mock-photo.jpg',
          width: 1920,
          height: 1080,
        })),
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

describe('Scenario: Preview photo and verify quality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockImageCropPicker.openCropper.mockResolvedValue({ path: 'file:///cropped-photo.jpg' });
  });

  it('displays preview with translate prompt after capture and crop', async () => {
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    fireEvent.press(screen.getByTestId('shutter-button'));

    await screen.findByTestId('photo-preview');

    const qualityPrompt = screen.getByText(/ready to translate/i);
    expect(qualityPrompt).toBeTruthy();
  });

  it('shows "Translate" and "Retake" buttons after capture and crop', async () => {
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    fireEvent.press(screen.getByTestId('shutter-button'));

    await screen.findByTestId('photo-preview');

    expect(screen.getByTestId('use-photo-button')).toBeTruthy();
    expect(screen.getByTestId('retake-button')).toBeTruthy();
    expect(screen.getByTestId('use-photo-button')).toHaveTextContent(/translate/i);
    expect(screen.getByTestId('retake-button')).toHaveTextContent(/retake/i);
  });

  it('returns to camera view when retake is pressed from preview', async () => {
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    fireEvent.press(screen.getByTestId('shutter-button'));
    await screen.findByTestId('photo-preview');

    fireEvent.press(screen.getByTestId('retake-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('photo-preview')).toBeNull();
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });
  });
});
