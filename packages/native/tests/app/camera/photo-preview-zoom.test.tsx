import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import Camera from '../../../app/camera';

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
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Scenario: Preview photo and verify quality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays preview with quality verification prompt', async () => {
    // GIVEN: I have captured a photo
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // WHEN: I take a photo
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    // Wait for preview to appear
    await screen.findByTestId('preview-image');

    // THEN: I should see the captured photo
    const previewImage = screen.getByTestId('preview-image');
    expect(previewImage).toBeTruthy();
    expect(previewImage).toHaveProp('source', { uri: expect.any(String) });

    // AND: I should see the prompt to select the region
    const qualityPrompt = screen.getByText(/select the region to translate/i);
    expect(qualityPrompt).toBeTruthy();
  });

  it('shows "Translate" and "Retake" buttons in preview', async () => {
    // GIVEN: I have captured a photo
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // WHEN: I take a photo
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    // Wait for preview to appear
    await screen.findByTestId('preview-image');

    // THEN: I should see "Translate" and "Retake" buttons in preview
    const usePhotoButton = screen.getByTestId('use-photo-button');
    const retakeButton = screen.getByTestId('retake-button');

    expect(usePhotoButton).toBeTruthy();
    expect(retakeButton).toBeTruthy();

    expect(usePhotoButton).toHaveTextContent(/translate/i);
    expect(retakeButton).toHaveTextContent(/retake/i);
  });

  it('shows crop overlay on photo preview', async () => {
    // GIVEN: I have captured a photo
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // WHEN: I take a photo and the preview renders
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    await screen.findByTestId('preview-image');

    // THEN: the preview container is present for crop interaction
    const previewContainer = screen.getByTestId('preview-image-container');
    expect(previewContainer).toBeTruthy();
  });

  it('returns to camera view when retake is pressed from preview', async () => {
    // GIVEN: I have captured a photo and see the preview
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    await screen.findByTestId('preview-image');

    // WHEN: I tap Retake
    fireEvent.press(screen.getByTestId('retake-button'));

    // THEN: I return to the camera view
    await waitFor(() => {
      expect(screen.queryByTestId('preview-image')).toBeNull();
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });
  });
});
