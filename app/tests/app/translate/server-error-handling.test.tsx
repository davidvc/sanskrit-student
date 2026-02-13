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

    render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
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
  });

  it('displays error message for GraphQL errors and allows retry', async () => {
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
    await waitFor(() => {
      const button = screen.getByTestId('translate-button');
      expect(button).toHaveAccessibilityState({ disabled: false });
    });
  });

  it('clears error message on successful retry', async () => {
    // GIVEN: I have received an error
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
                meanings: ['I bow to you'],
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

    const input = screen.getByPlaceholderText(/enter sanskrit text/i);

    // First request causes error
    fireEvent.changeText(input, 'om');
    const translateButton = screen.getByTestId('translate-button');
    fireEvent.press(translateButton);

    await waitFor(() => {
      expect(screen.getByText(/network error|failed to fetch|error/i)).toBeTruthy();
    });

    // WHEN: I change the input and retry with different text
    fireEvent.changeText(input, 'namaste');
    fireEvent.press(translateButton);

    // THEN: the translation should succeed
    await waitFor(() => {
      expect(screen.getAllByText('namaste').length).toBeGreaterThan(0);
    });

    // AND: the error message should be cleared
    expect(screen.queryByText(/network error|failed to fetch/i)).toBeNull();
  });
});
