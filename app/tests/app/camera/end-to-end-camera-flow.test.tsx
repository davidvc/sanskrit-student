import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import Camera from '../../../app/camera';
import { TranslateSutraFromImageDocument } from '../../../lib/graphql/generated';

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
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Scenario: Complete camera to translation flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTakePictureAsync.mockResolvedValue({
      uri: 'file:///mock-photo.jpg',
      width: 1920,
      height: 1080,
      base64: null,
    });

    // Mock fetch to handle photo URI conversion
    global.fetch = jest.fn((url: string) => {
      if (url.startsWith('file:///')) {
        const blob = new Blob(['mock-image-data'], { type: 'image/jpeg' });
        return Promise.resolve({
          blob: () => Promise.resolve(blob),
        } as Response);
      }
      return Promise.reject(new Error('Unexpected fetch URL'));
    }) as jest.Mock;
  });

  it('completes full journey from camera launch to translation display', async () => {
    // GIVEN: I am a spiritual practitioner studying a Sanskrit book
    // AND: I encounter Devanagari text I cannot read
    const mocks = [
      {
        request: {
          query: TranslateSutraFromImageDocument,
        },
        variableMatcher: () => true, // Accept any variables for file upload
        result: {
          data: {
            translateSutraFromImage: {
              originalText: ['सत्यमेव', 'जयते', 'नानृतम्'],
              iastText: ['satyameva', 'jayate', 'nānṛtam'],
              words: [
                { word: 'satyam', meanings: ['truth', 'reality'] },
                { word: 'eva', meanings: ['indeed', 'only'] },
                { word: 'jayate', meanings: ['triumphs', 'conquers'] },
                { word: 'na', meanings: ['not'] },
                { word: 'anṛtam', meanings: ['falsehood', 'untruth'] },
              ],
              alternativeTranslations: [
                'Truth conquers all',
                'Truth ultimately prevails',
              ],
              ocrConfidence: 0.96,
              extractedText: 'सत्यमेव जयते नानृतम्',
              ocrWarnings: [],
            },
          },
        },
        delay: 1500,
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    // WHEN: the camera opens
    const cameraView = screen.getByTestId('camera-view');
    expect(cameraView).toBeTruthy();

    // AND: I see guidance for photographing text
    const guidanceText = screen.getByText(/best results.*photograph 2-6 lines/i);
    expect(guidanceText).toBeTruthy();

    // AND: I position my phone over a 3-line Devanagari sutra
    // AND: I tap the shutter button
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    // THEN: a photo should be captured
    // AND: I should see a preview
    await waitFor(() => {
      const previewImage = screen.getByTestId('preview-image');
      expect(previewImage).toBeTruthy();
    });

    // AND: I should see quality verification prompt
    const qualityPrompt = screen.getByText(/is the text clear and in focus/i);
    expect(qualityPrompt).toBeTruthy();

    // WHEN: I verify the photo is clear
    // AND: I tap "Use This Photo"
    const usePhotoButton = screen.getByTestId('use-photo-button');
    fireEvent.press(usePhotoButton);

    // THEN: I should see "Uploading image..." progress message
    await waitFor(() => {
      expect(screen.getByText(/uploading image/i)).toBeTruthy();
    });

    // AND: I should see "Reading Devanagari text..." when OCR begins
    await waitFor(() => {
      expect(screen.getByText(/reading devanagari text/i)).toBeTruthy();
    });

    // AND: I should see "Translating..." when translation begins
    await waitFor(() => {
      expect(screen.getByText(/translating/i)).toBeTruthy();
    });

    // WHEN: all processing completes
    // THEN: I should be navigated to the translation results
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/translate',
            params: expect.objectContaining({
              fromCamera: true,
              ocrConfidence: 0.96,
            }),
          })
        );
      },
      { timeout: 5000 }
    );
  });

  it('handles retake during the flow', async () => {
    // GIVEN: I have captured a photo
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    await waitFor(() => {
      expect(screen.getByTestId('preview-image')).toBeTruthy();
    });

    // WHEN: I notice the photo is blurry
    // AND: I tap "Retake"
    const retakeButton = screen.getByTestId('retake-button');
    fireEvent.press(retakeButton);

    // THEN: I should return to the camera view
    await waitFor(() => {
      expect(screen.queryByTestId('preview-image')).toBeNull();
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });

    // AND: I can take another photo
    const shutterButtonAgain = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButtonAgain);

    // AND: the new preview should appear
    await waitFor(() => {
      expect(screen.getByTestId('preview-image')).toBeTruthy();
    });
  });

  it('displays high confidence badge in results', async () => {
    // GIVEN: I have submitted a clear photo
    const mocks = [
      {
        request: {
          query: TranslateSutraFromImageDocument,
        },
        variableMatcher: () => true, // Accept any variables for file upload
        result: {
          data: {
            translateSutraFromImage: {
              originalText: ['सत्यमेव'],
              iastText: ['satyameva'],
              words: [{ word: 'satyam', meanings: ['truth'] }],
              alternativeTranslations: [],
              ocrConfidence: 0.96,
              extractedText: 'सत्यमेव',
              ocrWarnings: [],
            },
          },
        },
        delay: 500,
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    await waitFor(() => {
      expect(screen.getByTestId('preview-image')).toBeTruthy();
    });

    const usePhotoButton = screen.getByTestId('use-photo-button');
    fireEvent.press(usePhotoButton);

    // WHEN: OCR extraction completes with 96% confidence
    // THEN: results page should display with high confidence badge
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              ocrConfidence: 0.96,
            }),
          })
        );
      },
      { timeout: 5000 }
    );

    // Note: The actual badge rendering is tested in translation screen tests
    // This test verifies the confidence score is passed correctly
  });

  it('handles low confidence warning gracefully', async () => {
    // GIVEN: I have submitted a blurry photo
    const mocks = [
      {
        request: {
          query: TranslateSutraFromImageDocument,
        },
        variableMatcher: () => true, // Accept any variables for file upload
        result: {
          data: {
            translateSutraFromImage: {
              originalText: ['सत्यमेव'],
              iastText: ['satyameva'],
              words: [{ word: 'satyam', meanings: ['truth'] }],
              alternativeTranslations: [],
              ocrConfidence: 0.65,
              extractedText: 'सत्यमेव',
              ocrWarnings: ['Low image quality detected'],
            },
          },
        },
        delay: 500,
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    await waitFor(() => {
      expect(screen.getByTestId('preview-image')).toBeTruthy();
    });

    const usePhotoButton = screen.getByTestId('use-photo-button');
    fireEvent.press(usePhotoButton);

    // WHEN: OCR extraction completes with 65% confidence
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              ocrConfidence: 0.65,
              ocrWarnings: JSON.stringify(['Low image quality detected']),
            }),
          })
        );
      },
      { timeout: 5000 }
    );

    // THEN: results page should show low confidence warning
    // AND: provide option to retake photo
  });

  it('preserves line structure in multi-line sutras', async () => {
    // GIVEN: I photograph a 6-line sutra
    const mocks = [
      {
        request: {
          query: TranslateSutraFromImageDocument,
        },
        variableMatcher: () => true, // Accept any variables for file upload
        result: {
          data: {
            translateSutraFromImage: {
              originalText: [
                'सत्यमेव',
                'जयते',
                'नानृतम्',
                'सत्येन',
                'पन्था',
                'विततो',
              ],
              iastText: [
                'satyameva',
                'jayate',
                'nānṛtam',
                'satyena',
                'panthā',
                'vitato',
              ],
              words: [
                { word: 'satyam', meanings: ['truth'] },
                { word: 'eva', meanings: ['indeed'] },
                { word: 'jayate', meanings: ['triumphs'] },
              ],
              alternativeTranslations: [],
              ocrConfidence: 0.91,
              extractedText: 'सत्यमेव जयते नानृतम् सत्येन पन्था विततो',
              ocrWarnings: [],
            },
          },
        },
        delay: 1000,
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    await waitFor(() => {
      expect(screen.getByTestId('preview-image')).toBeTruthy();
    });

    const usePhotoButton = screen.getByTestId('use-photo-button');
    fireEvent.press(usePhotoButton);

    // WHEN: OCR processing completes
    // THEN: all 6 lines should be extracted
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              extractedText: expect.stringContaining('सत्यमेव'),
            }),
          })
        );
      },
      { timeout: 5000 }
    );

    // AND: line structure should be preserved in originalText array (as JSON string in params)
    const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
    const originalText = JSON.parse(lastCall.params.originalText);
    expect(originalText).toEqual([
      'सत्यमेव',
      'जयते',
      'नानृतम्',
      'सत्येन',
      'पन्था',
      'विततो',
    ]);
  });
});
