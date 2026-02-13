import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import TranslateScreen from '../../../app/translate';
import { TRANSLATE_SUTRA_QUERY } from '../../../graphql/queries/translateSutra';

describe('Scenario: Server error handling', () => {
  it('displays error message and allows retry when server returns error', async () => {
    // GIVEN: I am on the translation frontend page
    // AND: the GraphQL server returns an error
    const errorMock = {
      request: {
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: 'om' },
      },
      error: new Error('Network error: Failed to fetch'),
    };

    const successMock = {
      request: {
        query: TRANSLATE_SUTRA_QUERY,
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
    };

    render(
      <MockedProvider mocks={[errorMock, successMock]} addTypename={false}>
        <TranslateScreen />
      </MockedProvider>
    );

    // WHEN: I submit a translation request
    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, 'om');

    const translateButton = screen.getByTestId('translate-button');
    fireEvent.press(translateButton);

    // THEN: I should see an error message explaining the problem
    await waitFor(() => {
      const errorMessage = screen.getByText(/network error|failed to fetch|error/i);
      expect(errorMessage).toBeTruthy();
    });

    // AND: I should be able to retry the translation
    // The translate button should still be enabled for retry
    await waitFor(() => {
      const button = screen.getByTestId('translate-button');
      expect(button).toHaveAccessibilityState({ disabled: false });
    });

    // WHEN: I retry the translation
    fireEvent.press(translateButton);

    // THEN: the translation should succeed
    await waitFor(() => {
      expect(screen.getAllByText('oṃ').length).toBeGreaterThan(0);
    });

    // AND: the error message should disappear
    expect(screen.queryByText(/network error|failed to fetch/i)).toBeNull();
  });

  it('displays error message for GraphQL errors', async () => {
    // GIVEN: the GraphQL server returns a GraphQL error
    const graphQLErrorMock = {
      request: {
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: 'invalid text' },
      },
      result: {
        errors: [new GraphQLError('Translation service unavailable')],
      },
    };

    render(
      <MockedProvider mocks={[graphQLErrorMock]} addTypename={false}>
        <TranslateScreen />
      </MockedProvider>
    );

    // WHEN: I submit a translation request
    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, 'invalid text');

    const translateButton = screen.getByTestId('translate-button');
    fireEvent.press(translateButton);

    // THEN: I should see an error message
    await waitFor(() => {
      const errorMessage = screen.getByText(/translation service unavailable|error/i);
      expect(errorMessage).toBeTruthy();
    });

    // AND: I should be able to retry
    const button = screen.getByTestId('translate-button');
    expect(button).toHaveAccessibilityState({ disabled: false });
  });
});
