import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import TranslateScreen from '../../../app/translate';

describe('Scenario: Empty input validation', () => {
  it('shows error message when translate button is clicked with empty input', async () => {
    // GIVEN: I am on the translation frontend page
    const mocks: any[] = [];

    render(
      <MockedProvider mocks={mocks}>
        <TranslateScreen />
      </MockedProvider>
    );

    // AND: the translation input field is empty
    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    expect(input.props.value).toBe('');

    // WHEN: I click the "Translate" button
    const translateButton = screen.getByText(/translate/i);
    fireEvent.press(translateButton);

    // THEN: I should see an error message "Please enter Sanskrit text to translate"
    await waitFor(() => {
      expect(screen.getByText('Please enter Sanskrit text to translate')).toBeTruthy();
    });

    // AND: no translation request should be sent to the server
    // (verified by having no mocks - any GraphQL request would fail the test)
  });

  it('shows error message when translate button is clicked with whitespace-only input', async () => {
    // GIVEN: I am on the translation frontend page
    const mocks: any[] = [];

    render(
      <MockedProvider mocks={mocks}>
        <TranslateScreen />
      </MockedProvider>
    );

    // AND: the translation input field contains only whitespace
    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, '   ');

    // WHEN: I click the "Translate" button
    const translateButton = screen.getByText(/translate/i);
    fireEvent.press(translateButton);

    // THEN: I should see an error message "Please enter Sanskrit text to translate"
    await waitFor(() => {
      expect(screen.getByText('Please enter Sanskrit text to translate')).toBeTruthy();
    });

    // AND: no translation request should be sent to the server
  });
});
