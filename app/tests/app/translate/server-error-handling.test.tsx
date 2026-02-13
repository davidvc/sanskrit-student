import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import TranslateScreen from '../../../app/translate';
import { TranslateSutraDocument } from '../../../lib/graphql/generated';

const createTranslateMock = (sutra: string, data: any) => ({
  request: {
    query: TranslateSutraDocument,
    variables: { sutra },
  },
  result: {
    data: {
      translateSutra: {
        __typename: 'Translation',
        ...data,
      },
    },
  },
});

const createErrorMock = (sutra: string, errorMessage: string) => ({
  request: {
    query: TranslateSutraDocument,
    variables: { sutra },
  },
  error: new Error(errorMessage),
});

describe('Scenario: Server error handling', () => {
  it('displays error message and allows retry when server returns error', async () => {
    // GIVEN: I am on the translation frontend page
    // AND: the GraphQL server returns an error
    const errorMock = createErrorMock('om', 'Network error: Failed to fetch');

    render(
      <MockedProvider mocks={[errorMock]}>
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
        query: TranslateSutraDocument,
        variables: { sutra: 'invalid text' },
      },
      result: {
        errors: [new GraphQLError('Translation service unavailable')],
      },
    };

    render(
      <MockedProvider mocks={[graphQLErrorMock]}>
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
    const errorMock = createErrorMock('om', 'Network error: Failed to fetch');

    const successMock = createTranslateMock('namaste', {
      originalText: ['namaste'],
      iastText: ['namaste'],
      words: [
        {
          word: 'namaste',
          meanings: ['I bow to you'],
        },
      ],
      alternativeTranslations: [],
    });

    render(
      <MockedProvider mocks={[errorMock, successMock]}>
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
