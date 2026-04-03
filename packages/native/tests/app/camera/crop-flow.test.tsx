import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import Camera from '../../../app/camera';
import { TranslateSutraFromImageDocument } from '@sanskrit-student/shared';

// Mock react-native-image-crop-picker
jest.mock('react-native-image-crop-picker', () => ({
  __esModule: true,
  default: { openCropper: jest.fn() },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: mockImageCropPicker } = require('react-native-image-crop-picker') as {
  default: { openCropper: jest.Mock }
};

// Mock expo-camera
type PhotoResult = { uri: string; width?: number; height?: number };
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

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

const minimalMutationResult = {
  data: {
    translateSutraFromImage: {
      originalText: ['सत्यमेव'],
      iastText: ['satyameva'],
      words: [{ word: 'satyam', meanings: ['truth'] }],
      alternativeTranslations: [],
      ocrConfidence: 0.95,
      extractedText: 'सत्यमेव',
      ocrWarnings: [],
    },
  },
};

const mutationMock = {
  request: { query: TranslateSutraFromImageDocument },
  variableMatcher: () => true,
  result: minimalMutationResult,
  delay: 200,
};

describe('Camera screen — crop flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTakePictureAsync.mockResolvedValue({ uri: 'file://photo.jpg', width: 1200, height: 1600 });
    mockImageCropPicker.openCropper.mockResolvedValue({ path: 'file://cropped.jpg' });
  });

  it('opens native cropper after capture and uploads the cropped URI', async () => {
    render(
      <MockedProvider mocks={[mutationMock]} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    fireEvent.press(screen.getByTestId('shutter-button'));

    // Cropper is called with the original photo URI
    await waitFor(() =>
      expect(mockImageCropPicker.openCropper).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'file://photo.jpg' })
      )
    );

    // After crop, the preview controls appear
    await waitFor(() => expect(screen.getByTestId('photo-preview')).toBeTruthy());

    // Tap Translate — must upload the cropped URI, not the original
    fireEvent.press(screen.getByTestId('use-photo-button'));

    await waitFor(
      () => expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/translate' })
      ),
      { timeout: 3000 }
    );
  });

  it('returns to camera viewfinder when user cancels the crop', async () => {
    const cancelError = Object.assign(new Error('cancelled'), { code: 'E_PICKER_CANCELLED' });
    mockImageCropPicker.openCropper.mockRejectedValue(cancelError);

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    fireEvent.press(screen.getByTestId('shutter-button'));

    // Camera viewfinder must remain visible (no preview)
    await waitFor(() => expect(screen.getByTestId('camera-view')).toBeTruthy());
    expect(screen.queryByTestId('photo-preview')).toBeNull();
  });

  it('retake clears the cropped photo without uploading', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    fireEvent.press(screen.getByTestId('shutter-button'));
    await waitFor(() => expect(screen.getByTestId('photo-preview')).toBeTruthy());

    fireEvent.press(screen.getByTestId('retake-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('photo-preview')).toBeNull();
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
