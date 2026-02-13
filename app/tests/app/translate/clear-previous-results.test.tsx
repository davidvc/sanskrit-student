import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import TranslateScreen from '../../../app/translate';
import { TRANSLATE_SUTRA_QUERY } from '../../../graphql/queries/translateSutra';

describe('Scenario: Clear previous results', () => {
  it('clears previous translation results when new text is translated', async () => {
    // GIVEN: I am on the translation frontend page
    // AND: the GraphQL server is running
    const firstMock = {
      request: {
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: 'namaste' },
      },
      result: {
        data: {
          translateSutra: {
            originalText: ['namaste'],
            iastText: ['namaste'],
            words: [
              {
                word: 'namaste',
                meanings: ['greetings, salutations'],
              },
            ],
            alternativeTranslations: ['Greetings to you'],
          },
        },
      },
    };

    const secondMock = {
      request: {
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: 'atha' },
      },
      result: {
        data: {
          translateSutra: {
            originalText: ['atha'],
            iastText: ['atha'],
            words: [
              {
                word: 'atha',
                meanings: ['now, here begins'],
              },
            ],
            alternativeTranslations: ['Now begins'],
          },
        },
      },
      delay: 100, // Simulate network delay
    };

    render(
      <MockedProvider mocks={[firstMock, secondMock]} addTypename={false}>
        <TranslateScreen />
      </MockedProvider>
    );

    // GIVEN: I have previously translated text showing on the page
    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, 'namaste');

    const translateButton = screen.getByTestId('translate-button');
    fireEvent.press(translateButton);

    // Wait for first translation to appear
    await waitFor(() => {
      expect(screen.getAllByText('namaste').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/greetings, salutations/i).length).toBeGreaterThan(0);
    });

    // WHEN: I enter new text in the input field
    fireEvent.changeText(input, 'atha');

    // AND: I click the "Translate" button
    fireEvent.press(translateButton);

    // THEN: the previous translation results should be cleared immediately
    // During the loading phase, NO result sections should be visible
    // This ensures old results don't linger while new ones are loading
    const wordBreakdownSection = screen.queryByText('Word Breakdown:');
    const originalTextSection = screen.queryByText('Original Text:');

    // Both sections should be gone - this is the key requirement
    expect(wordBreakdownSection).toBeNull();
    expect(originalTextSection).toBeNull();

    // Wait for new translation to load
    await waitFor(() => {
      // New translation should be visible
      expect(screen.getAllByText('atha').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/now, here begins/i).length).toBeGreaterThan(0);
    });

    // AND: only the new translation should be displayed
    // The old translation should not be visible
    const greetingsTexts = screen.queryAllByText(/greetings, salutations/i);
    expect(greetingsTexts.length).toBe(0);
  });
});
