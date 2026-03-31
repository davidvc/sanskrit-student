import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import Camera from '../../../app/camera';
import { TranslateSutraFromImageDocument } from '@sanskrit-student/shared';

// Mock expo-image-manipulator — jest.mock is hoisted, so the factory runs before any
// const declarations. Access the mock fn via require() after the mock is registered.
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { manipulateAsync: mockManipulateAsync } = require('expo-image-manipulator') as { manipulateAsync: jest.Mock };

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

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
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

/** Fire layout event on the preview container to initialize cropRegion and containerSize. */
async function simulateContainerLayout(containerWidth: number, containerHeight: number) {
  await act(async () => {
    const container = screen.getByTestId('preview-image-container');
    fireEvent(container, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: containerWidth, height: containerHeight } },
    });
  });
}

describe('Camera screen — crop flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockTakePictureAsync.mockResolvedValue({ uri: 'file://photo.jpg', width: 1200, height: 1600 });
    mockManipulateAsync.mockResolvedValue({ uri: 'file://cropped.jpg' });
  });

  it('uploads the cropped URI, not the original photo URI', async () => {
    render(
      <MockedProvider mocks={[mutationMock]} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    // Take a photo
    fireEvent.press(screen.getByTestId('shutter-button'));
    await waitFor(() => expect(screen.getByTestId('preview-image')).toBeTruthy());

    // Simulate container layout and image load so crop state is initialized
    await simulateContainerLayout(300, 400);

    // Verify crop overlay appears
    await waitFor(() => expect(screen.getByTestId('crop-overlay')).toBeTruthy());

    // Tap Translate
    fireEvent.press(screen.getByTestId('use-photo-button'));

    // manipulateAsync must be called once
    await waitFor(() => {
      expect(mockManipulateAsync).toHaveBeenCalledTimes(1);
    });

    // The mutation must be called with the cropped URI, not the original
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.objectContaining({ pathname: '/translate' })
        );
      },
      { timeout: 3000 }
    );

    const cropArgs = mockManipulateAsync.mock.calls[0];
    expect(cropArgs[0]).toBe('file://photo.jpg');
    expect(cropArgs[1]).toEqual([
      expect.objectContaining({ crop: expect.any(Object) }),
    ]);
  });

  it('passes the correct image-space crop coordinates to manipulateAsync', async () => {
    render(
      <MockedProvider mocks={[mutationMock]} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    fireEvent.press(screen.getByTestId('shutter-button'));
    await waitFor(() => expect(screen.getByTestId('preview-image')).toBeTruthy());

    // Container: 300×400, Image: 1200×1600 → scale 4×
    await simulateContainerLayout(300, 400);

    await waitFor(() => expect(screen.getByTestId('crop-overlay')).toBeTruthy());

    fireEvent.press(screen.getByTestId('use-photo-button'));

    await waitFor(() => expect(mockManipulateAsync).toHaveBeenCalledTimes(1), { timeout: 3000 });

    const [, actions] = mockManipulateAsync.mock.calls[0] as [string, Array<{ crop: { originX: number; originY: number; width: number; height: number } }>];
    const { crop } = actions[0];

    // Default region is 80% centred: display x=30, y=40, w=240, h=320
    // Scaled by 4: image x=120, y=160, w=960, h=1280
    expect(crop.originX).toBe(120);
    expect(crop.originY).toBe(160);
    expect(crop.width).toBe(960);
    expect(crop.height).toBe(1280);
  });

  it('retake clears the photo without cropping or uploading', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    fireEvent.press(screen.getByTestId('shutter-button'));
    await waitFor(() => expect(screen.getByTestId('preview-image')).toBeTruthy());

    await simulateContainerLayout(300, 400);
    await waitFor(() => expect(screen.getByTestId('crop-overlay')).toBeTruthy());

    // Tap Retake
    fireEvent.press(screen.getByTestId('retake-button'));

    // Crop overlay and preview image must be gone
    await waitFor(() => {
      expect(screen.queryByTestId('crop-overlay')).toBeNull();
      expect(screen.queryByTestId('preview-image')).toBeNull();
    });

    // Camera viewfinder must be back
    expect(screen.getByTestId('camera-view')).toBeTruthy();

    // No crop or upload must have happened
    expect(mockManipulateAsync).not.toHaveBeenCalled();
  });
});
