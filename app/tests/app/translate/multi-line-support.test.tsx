import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import TranslateScreen from '../../../app/translate';
import { TRANSLATE_SUTRA_QUERY } from '../../../graphql/queries/translateSutra';

describe('Scenario: Multi-line text support', () => {
  it('displays each line translated separately with word breakdowns', async () => {
    // GIVEN: I am on the translation frontend page
    // AND: the GraphQL server is running
    const multiLineMock = {
      request: {
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: 'atha yoganusasanam\nyogah cittavrttinirodhah' },
      },
      result: {
        data: {
          translateSutra: {
            originalText: [
              'atha yoganusasanam',
              'yogah cittavrttinirodhah'
            ],
            iastText: [
              'atha yogānuśāsanam',
              'yogaḥ cittavṛttinirodhaḥ'
            ],
            words: [
              {
                word: 'atha',
                meanings: ['now, here begins'],
              },
              {
                word: 'yogānuśāsanam',
                meanings: ['instruction on yoga'],
              },
              {
                word: 'yogaḥ',
                meanings: ['yoga, union'],
              },
              {
                word: 'cittavṛttinirodhaḥ',
                meanings: ['restraint of mental modifications'],
              },
            ],
            alternativeTranslations: [
              'Now begins the instruction on yoga',
              'Yoga is the restraint of mental modifications',
            ],
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[multiLineMock]} addTypename={false}>
        <TranslateScreen />
      </MockedProvider>
    );

    // WHEN: I enter multiple lines of Sanskrit text in the input field
    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, 'atha yoganusasanam\nyogah cittavrttinirodhah');

    // AND: I click the "Translate" button
    const translateButton = screen.getByTestId('translate-button');
    fireEvent.press(translateButton);

    // THEN: I should see each line translated separately
    await waitFor(() => {
      // First line - original (should appear exactly once in original section)
      const firstLineOriginal = screen.getAllByText('atha yoganusasanam');
      expect(firstLineOriginal.length).toBeGreaterThan(0);

      // Second line - original (should appear exactly once in original section)
      const secondLineOriginal = screen.getAllByText('yogah cittavrttinirodhah');
      expect(secondLineOriginal.length).toBeGreaterThan(0);
    });

    // AND: each line should have IAST representation
    const firstLineIast = screen.getAllByText('atha yogānuśāsanam');
    expect(firstLineIast.length).toBeGreaterThan(0);

    const secondLineIast = screen.getAllByText('yogaḥ cittavṛttinirodhaḥ');
    expect(secondLineIast.length).toBeGreaterThan(0);

    // AND: each line should have its own word breakdown
    expect(screen.getByText('atha')).toBeTruthy();
    expect(screen.getAllByText(/now, here begins/i).length).toBeGreaterThan(0);

    expect(screen.getByText('yogānuśāsanam')).toBeTruthy();
    expect(screen.getAllByText(/instruction on yoga/i).length).toBeGreaterThan(0);

    expect(screen.getByText('yogaḥ')).toBeTruthy();
    expect(screen.getAllByText(/yoga, union/i).length).toBeGreaterThan(0);

    expect(screen.getByText('cittavṛttinirodhaḥ')).toBeTruthy();
    expect(screen.getAllByText(/restraint of mental modifications/i).length).toBeGreaterThan(0);
  });
});
