import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import * as Clipboard from 'expo-clipboard';
import TranslateScreen from '../../../app/translate';
import { TRANSLATE_SUTRA_QUERY } from '../../../graphql/queries/translateSutra';

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

describe('Scenario: Copy translation results to clipboard', () => {
  it('copies IAST text to clipboard when copy button is clicked', async () => {
    // GIVEN: I am on the translation frontend page
    // AND: I have a successful translation displayed
    const mocks = [
      {
        request: {
          query: TRANSLATE_SUTRA_QUERY,
          variables: { sutra: 'atha yoganusasanam' },
        },
        result: {
          data: {
            translateSutra: {
              originalText: ['atha yoganusasanam'],
              iastText: ['atha yogānuśāsanam'],
              words: [
                {
                  word: 'atha',
                  meanings: ['now, here begins'],
                },
                {
                  word: 'yogānuśāsanam',
                  meanings: ['instruction on yoga'],
                },
              ],
              alternativeTranslations: [
                'Now begins the instruction on yoga',
                'Here begins the teaching of yoga',
              ],
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <TranslateScreen />
      </MockedProvider>
    );

    // First, trigger a translation
    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, 'atha yoganusasanam');

    const translateButton = screen.getByText(/translate/i);
    fireEvent.press(translateButton);

    // Wait for translation results to appear
    await waitFor(() => {
      expect(screen.getByText('atha yogānuśāsanam')).toBeTruthy();
    });

    // WHEN: I click the "Copy" button next to the IAST text
    const copyButton = screen.getByTestId('copy-iast-button');
    fireEvent.press(copyButton);

    // THEN: the IAST text should be copied to my clipboard
    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('atha yogānuśāsanam');
    });

    // AND: I should see a confirmation message
    expect(screen.getByText(/copied to clipboard/i)).toBeTruthy();
  });
});
