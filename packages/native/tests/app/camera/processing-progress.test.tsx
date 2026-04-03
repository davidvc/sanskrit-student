import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import { gql } from '@apollo/client';
import React from 'react';
import Camera from '../../../app/camera';

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
        takePictureAsync: jest.fn<() => Promise<{ uri: string }>>().mockResolvedValue({
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

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Scenario: Show processing progress', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn<() => Promise<{ blob: () => Promise<Blob> }>>().mockResolvedValue({
      blob: jest.fn<() => Promise<Blob>>().mockResolvedValue(new Blob(['mock-image'], { type: 'image/jpeg', lastModified: Date.now() })),
    }) as unknown as typeof fetch;
  });

  it('shows "Processing..." with a progress indicator while mutation is in flight', async () => {
    // GIVEN: I have submitted a photo for processing
    const mocks = [
      {
        request: { query: TRANSLATE_SUTRA_FROM_IMAGE },
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

    // Take a photo
    const shutterButton = screen.getByTestId('shutter-button');
    fireEvent.press(shutterButton);

    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeTruthy();
    });

    // WHEN: I tap "Translate"
    const usePhotoButton = screen.getByTestId('use-photo-button');
    fireEvent.press(usePhotoButton);

    // THEN: I should see "Processing..." with a progress indicator
    await waitFor(() => {
      expect(screen.getByText(/processing\.\.\./i)).toBeTruthy();
      expect(screen.getByTestId('upload-progress-indicator')).toBeTruthy();
    });
  });
});
