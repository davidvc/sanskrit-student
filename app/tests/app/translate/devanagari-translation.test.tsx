import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import TranslateScreen from '../../../app/translate';
import { TRANSLATE_SUTRA_QUERY } from '../../../graphql/queries/translateSutra';

describe('Scenario: Successful translation of Devanagari text', () => {
  it('displays translation results when translating Devanagari input', async () => {
    // GIVEN: I am on the translation frontend page
    // AND: the GraphQL server is running
    const mocks = [
      {
        request: {
          query: TRANSLATE_SUTRA_QUERY,
          variables: { sutra: 'अथ योगानुशासनम्' },
        },
        result: {
          data: {
            translateSutra: {
              originalText: ['अथ योगानुशासनम्'],
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

    // WHEN: I enter "अथ योगानुशासनम्" in the translation input field
    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, 'अथ योगानुशासनम्');

    // AND: I click the "Translate" button
    const translateButton = screen.getByText(/translate/i);
    fireEvent.press(translateButton);

    // THEN: I should see the original text "अथ योगानुशासनम्"
    await waitFor(() => {
      expect(screen.getByText('अथ योगानुशासनम्')).toBeTruthy();
    });

    // AND: I should see the IAST text "atha yogānuśāsanam"
    expect(screen.getByText('atha yogānuśāsanam')).toBeTruthy();

    // AND: I should see a word breakdown
    expect(screen.getByText('atha')).toBeTruthy();
    expect(screen.getByText(/now, here begins/i)).toBeTruthy();
    expect(screen.getByText('yogānuśāsanam')).toBeTruthy();

    // AND: I should see alternative translations
    expect(screen.getByText(/Now begins the instruction on yoga/i)).toBeTruthy();
    expect(screen.getByText(/Here begins the teaching of yoga/i)).toBeTruthy();
  });
});
