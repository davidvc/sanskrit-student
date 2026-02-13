import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import TranslateScreen from '../../../app/translate';
import { TRANSLATE_SUTRA_QUERY } from '../../../graphql/queries/translateSutra';

/**
 * AC10: Alternative translation display
 *
 * Given I am on the translation frontend page
 * And I have a successful translation with multiple alternatives
 * When I view the alternative translations section
 * Then I should see up to 3 alternative translations
 * And each alternative should be clearly separated and readable
 */
describe('Scenario: Alternative translation display', () => {
  it('displays up to 3 alternative translations with clear separation', async () => {
    // GIVEN: I am on the translation frontend page
    // AND: I have a successful translation with multiple alternatives
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
                  meanings: ['now'],
                },
                {
                  word: 'yogānuśāsanam',
                  meanings: ['instruction on yoga'],
                },
              ],
              alternativeTranslations: [
                'Now begins the instruction on yoga',
                'Here begins the teaching of yoga',
                'Now the exposition of yoga',
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

    // WHEN: I enter text and translate
    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, 'atha yoganusasanam');

    const translateButton = screen.getByText(/translate/i);
    fireEvent.press(translateButton);

    // THEN: I should see the alternative translations section
    await waitFor(() => {
      expect(screen.getByText('Alternative Translations:')).toBeTruthy();
    });

    // AND: I should see up to 3 alternative translations
    const alt1 = screen.getByText('Now begins the instruction on yoga');
    const alt2 = screen.getByText('Here begins the teaching of yoga');
    const alt3 = screen.getByText('Now the exposition of yoga');

    expect(alt1).toBeTruthy();
    expect(alt2).toBeTruthy();
    expect(alt3).toBeTruthy();

    // AND: each alternative should be clearly separated and readable
    // Verify they are rendered as separate Text components (clearly separated)
    expect(alt1.props.style).toBeDefined();
    expect(alt2.props.style).toBeDefined();
    expect(alt3.props.style).toBeDefined();
  });

  it('displays fewer than 3 alternatives when only some are available', async () => {
    // GIVEN: I have a translation with only 2 alternatives
    const mocks = [
      {
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
                  word: 'om',
                  meanings: ['sacred syllable'],
                },
              ],
              alternativeTranslations: [
                'The sacred sound Om',
                'The primordial syllable',
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

    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, 'om');

    const translateButton = screen.getByText(/translate/i);
    fireEvent.press(translateButton);

    // THEN: I should see exactly 2 alternatives
    await waitFor(() => {
      expect(screen.getByText('Alternative Translations:')).toBeTruthy();
    });

    expect(screen.getByText('The sacred sound Om')).toBeTruthy();
    expect(screen.getByText('The primordial syllable')).toBeTruthy();
  });

  it('displays maximum of 3 alternatives even when more are available', async () => {
    // GIVEN: I have a translation with 5 alternatives (more than the limit)
    const mocks = [
      {
        request: {
          query: TRANSLATE_SUTRA_QUERY,
          variables: { sutra: 'test' },
        },
        result: {
          data: {
            translateSutra: {
              originalText: ['test'],
              iastText: ['test'],
              words: [
                {
                  word: 'test',
                  meanings: ['test'],
                },
              ],
              alternativeTranslations: [
                'First alternative',
                'Second alternative',
                'Third alternative',
                'Fourth alternative - should not display',
                'Fifth alternative - should not display',
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

    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, 'test');

    const translateButton = screen.getByText(/translate/i);
    fireEvent.press(translateButton);

    // THEN: I should see only the first 3 alternatives
    await waitFor(() => {
      expect(screen.getByText('Alternative Translations:')).toBeTruthy();
    });

    expect(screen.getByText('First alternative')).toBeTruthy();
    expect(screen.getByText('Second alternative')).toBeTruthy();
    expect(screen.getByText('Third alternative')).toBeTruthy();

    // AND: I should NOT see the 4th and 5th alternatives
    expect(screen.queryByText('Fourth alternative - should not display')).toBeNull();
    expect(screen.queryByText('Fifth alternative - should not display')).toBeNull();
  });

  it('does not display alternative translations section when none are available', async () => {
    // GIVEN: I have a translation with no alternatives
    const mocks = [
      {
        request: {
          query: TRANSLATE_SUTRA_QUERY,
          variables: { sutra: 'test' },
        },
        result: {
          data: {
            translateSutra: {
              originalText: ['test'],
              iastText: ['test'],
              words: [
                {
                  word: 'test',
                  meanings: ['test'],
                },
              ],
              alternativeTranslations: [],
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

    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, 'test');

    const translateButton = screen.getByText(/translate/i);
    fireEvent.press(translateButton);

    // THEN: I should NOT see the alternative translations section
    await waitFor(() => {
      expect(screen.getByText('Original Text:')).toBeTruthy();
    });

    expect(screen.queryByText('Alternative Translations:')).toBeNull();
  });
});
