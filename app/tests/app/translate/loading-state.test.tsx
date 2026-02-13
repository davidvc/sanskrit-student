import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import TranslateScreen from '../../../app/translate';
import { TranslateSutraDocument } from '../../../lib/graphql/generated';

describe('Scenario: Loading state during translation', () => {
  it('displays loading indicator and disables button during translation', async () => {
    // GIVEN: I am on the translation frontend page
    const mocks = [
      {
        request: {
          query: TranslateSutraDocument,
          variables: { sutra: 'om' },
        },
        result: {
          data: {
            translateSutra: {
              originalText: ['om'],
              iastText: ['oṃ'],
              words: [
                {
                  word: 'oṃ',
                  meanings: ['sacred sound'],
                },
              ],
              alternativeTranslations: [],
            },
          },
        },
        // Add delay to simulate loading state
        delay: 100,
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <TranslateScreen />
      </MockedProvider>
    );

    // WHEN: I enter "om" in the translation input field
    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, 'om');

    // AND: I click the "Translate" button
    const translateButton = screen.getByTestId('translate-button');
    fireEvent.press(translateButton);

    // THEN: I should see a loading indicator
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });

    // AND: the "Translate" button should be disabled
    // Check using the accessibility state matcher
    await waitFor(() => {
      const button = screen.getByTestId('translate-button');
      // The button should have disabled in its accessibilityState
      expect(button).toHaveAccessibilityState({ disabled: true });
    });

    // WHEN: the translation completes
    await waitFor(() => {
      expect(screen.getAllByText('oṃ').length).toBeGreaterThan(0);
    });

    // THEN: the loading indicator should disappear
    expect(screen.queryByText(/loading/i)).toBeNull();

    // AND: the "Translate" button should be enabled
    const translateButtonAfterComplete = screen.getByTestId('translate-button');
    expect(translateButtonAfterComplete).toHaveAccessibilityState({ disabled: false });
  });
});
