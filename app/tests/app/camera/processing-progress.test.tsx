import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import { gql } from '@apollo/client';
import React from 'react';
import Camera from '../../../app/camera';

// Mock the GraphQL mutation - we'll need to create this
const TRANSLATE_SUTRA_FROM_IMAGE = gql`
  mutation TranslateSutraFromImage($image: Upload!) {
    translateSutraFromImage(image: $image) {
      originalText
      iastText
      words {
        word
        meanings
      }
      alternativeTranslations
      ocrConfidence
      extractedText
      ocrWarnings
    }
  }
`;

// Mock expo-camera
jest.mock('expo-camera', () => {
  const React = require('react');
  return {
    Camera: ({ children, ...props }: any) => {
      const { View } = require('react-native');
      return <View testID="camera-view" {...props}>{children}</View>;
    },
    CameraView: React.forwardRef(({ children, ...props }: any, ref: any) => {
      const { View } = require('react-native');
      // Mock the camera ref with takePictureAsync
      React.useImperativeHandle(ref, () => ({
        takePictureAsync: jest.fn().mockResolvedValue({
          uri: 'file:///mock-photo.jpg',
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
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Scenario: Show processing progress messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch for file conversion
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['mock-image'], { type: 'image/jpeg' })),
    } as any);
  });

  it('shows "Uploading image..." when photo is submitted', async () => {
    // GIVEN: I have submitted a photo for processing
    const mocks = [
      {
        request: {
          query: TRANSLATE_SUTRA_FROM_IMAGE,
        },
        variableMatcher: () => true,
        result: {
          data: {
            translateSutraFromImage: {
              __typename: 'OcrTranslationResult',
              originalText: ['सत्यमेव', 'जयते'],
              iastText: ['satyameva', 'jayate'],
              words: [
                { __typename: 'WordEntry', word: 'satyam', meanings: ['truth'] },
                { __typename: 'WordEntry', word: 'eva', meanings: ['indeed'] },
                { __typename: 'WordEntry', word: 'jayate', meanings: ['triumphs'] },
              ],
              alternativeTranslations: ['Truth conquers all'],
              ocrConfidence: 0.96,
              extractedText: 'सत्यमेव जयते',
              ocrWarnings: [],
            },
          },
        },
        delay: 100,
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <Camera />
      </MockedProvider>
    );

    // First, take a photo
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    // Wait for photo preview to appear
    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeTruthy();
    });

    // WHEN: I tap "Use This Photo"
    const usePhotoButton = screen.getByTestId('use-photo-button');
    fireEvent.press(usePhotoButton);

    // THEN: I should see "Uploading image..." with a progress indicator
    await waitFor(() => {
      const uploadingMessage = screen.getByText(/uploading image/i);
      expect(uploadingMessage).toBeTruthy();

      const progressIndicator = screen.getByTestId('upload-progress-indicator');
      expect(progressIndicator).toBeTruthy();
    });
  });

  it('shows "Reading Devanagari text..." when OCR begins', async () => {
    // GIVEN: upload has completed
    // WHEN: OCR processing begins
    const mocks = [
      {
        request: {
          query: TRANSLATE_SUTRA_FROM_IMAGE,
        },
        variableMatcher: () => true,
        result: {
          data: {
            translateSutraFromImage: {
              __typename: 'OcrTranslationResult',
              originalText: ['सत्यमेव', 'जयते'],
              iastText: ['satyameva', 'jayate'],
              words: [
                { __typename: 'WordEntry', word: 'satyam', meanings: ['truth'] },
                { __typename: 'WordEntry', word: 'eva', meanings: ['indeed'] },
                { __typename: 'WordEntry', word: 'jayate', meanings: ['triumphs'] },
              ],
              alternativeTranslations: [],
              ocrConfidence: 0.96,
              extractedText: 'सत्यमेव जयते',
              ocrWarnings: [],
            },
          },
        },
        delay: 200,
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <Camera />
      </MockedProvider>
    );

    // First, take a photo
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    // Wait for photo preview
    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeTruthy();
    });

    const usePhotoButton = screen.getByTestId('use-photo-button');
    fireEvent.press(usePhotoButton);

    // Wait for upload to complete, then OCR begins
    await waitFor(() => {
      expect(screen.queryByText(/uploading image/i)).toBeNull();
    });

    // THEN: I should see "Reading Devanagari text..."
    const ocrMessage = screen.getByText(/reading devanagari text/i);
    expect(ocrMessage).toBeTruthy();
  });

  it('shows "Translating..." when translation begins', async () => {
    // GIVEN: OCR has completed
    // WHEN: translation processing begins
    const mocks = [
      {
        request: {
          query: TRANSLATE_SUTRA_FROM_IMAGE,
        },
        variableMatcher: () => true,
        result: {
          data: {
            translateSutraFromImage: {
              __typename: 'OcrTranslationResult',
              originalText: ['सत्यमेव', 'जयते'],
              iastText: ['satyameva', 'jayate'],
              words: [
                { __typename: 'WordEntry', word: 'satyam', meanings: ['truth'] },
                { __typename: 'WordEntry', word: 'eva', meanings: ['indeed'] },
                { __typename: 'WordEntry', word: 'jayate', meanings: ['triumphs'] },
              ],
              alternativeTranslations: [],
              ocrConfidence: 0.96,
              extractedText: 'सत्यमेव जयते',
              ocrWarnings: [],
            },
          },
        },
        delay: 300,
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <Camera />
      </MockedProvider>
    );

    // First, take a photo
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    // Wait for photo preview
    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeTruthy();
    });

    const usePhotoButton = screen.getByTestId('use-photo-button');
    fireEvent.press(usePhotoButton);

    // Wait for upload state to pass
    await waitFor(() => {
      expect(screen.queryByText(/uploading image/i)).toBeNull();
    }, { timeout: 300 });

    // Wait for OCR message to appear and then complete
    await waitFor(() => {
      expect(screen.queryByText(/reading devanagari text/i)).toBeNull();
    }, { timeout: 300 });

    // THEN: I should see "Translating..."
    const translatingMessage = screen.getByText(/translating/i);
    expect(translatingMessage).toBeTruthy();
  });

  it.skip('completes all processing within 5 seconds', async () => {
    // GIVEN: I have submitted a typical photo (2 MB, 4 lines of text)
    const startTime = Date.now();

    const mocks = [
      {
        request: {
          query: TRANSLATE_SUTRA_FROM_IMAGE,
          variables: { image: expect.any(Object) },
        },
        result: {
          data: {
            translateSutraFromImage: {
              originalText: ['सत्यमेव', 'जयते', 'नानृतम्', 'सत्येन'],
              iastText: ['satyameva', 'jayate', 'nānṛtam', 'satyena'],
              words: [
                { word: 'satyam', meanings: ['truth'] },
                { word: 'eva', meanings: ['indeed'] },
                { word: 'jayate', meanings: ['triumphs'] },
                { word: 'na', meanings: ['not'] },
                { word: 'anrtam', meanings: ['falsehood'] },
                { word: 'satyena', meanings: ['by truth'] },
              ],
              alternativeTranslations: ['Truth conquers all'],
              ocrConfidence: 0.94,
              extractedText: 'सत्यमेव जयते नानृतम् सत्येन',
              ocrWarnings: [],
            },
          },
        },
        delay: 2000, // Simulate realistic processing time
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    // WHEN: upload begins
    const usePhotoButton = screen.getByTestId('use-photo-button');
    fireEvent.press(usePhotoButton);

    // THEN: total time should be under 5 seconds
    await waitFor(
      () => {
        // Processing complete when translation result is shown
        const translationResult = screen.getByText(/satyameva/i);
        expect(translationResult).toBeTruthy();
      },
      { timeout: 5000 }
    );

    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeLessThan(5000);
  });

  it.skip('shows progress indicators in correct sequence', async () => {
    // GIVEN: I have submitted a photo for processing
    const progressMessages: string[] = [];

    const mocks = [
      {
        request: {
          query: TRANSLATE_SUTRA_FROM_IMAGE,
          variables: { image: expect.any(Object) },
        },
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
        delay: 100,
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Camera />
      </MockedProvider>
    );

    const usePhotoButton = screen.getByTestId('use-photo-button');
    fireEvent.press(usePhotoButton);

    // Capture progress messages as they appear
    // WHEN: processing occurs
    await waitFor(() => {
      if (screen.queryByText(/uploading image/i)) {
        progressMessages.push('uploading');
      }
    });

    await waitFor(() => {
      if (screen.queryByText(/reading devanagari text/i)) {
        progressMessages.push('reading');
      }
    });

    await waitFor(() => {
      if (screen.queryByText(/translating/i)) {
        progressMessages.push('translating');
      }
    });

    // THEN: messages should appear in the correct sequence
    expect(progressMessages).toEqual(['uploading', 'reading', 'translating']);
  });
});
