import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import TranslateScreen from '../../../app/translate';
import { TranslateSutraDocument } from '../../../lib/graphql/generated';

describe('Scenario: Responsive layout', () => {
  it('should display a layout optimized for mobile viewing with accessible controls and readable text', () => {
    // GIVEN: I access the translation page on a mobile device
    const mock = {
      request: {
        query: TranslateSutraDocument,
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

    const { getByPlaceholderText, getByTestId } = render(
      <MockedProvider mocks={[mock]} addTypename={false}>
        <TranslateScreen />
      </MockedProvider>
    );

    // THEN: all controls should be accessible
    const input = getByPlaceholderText(/enter sanskrit text/i);
    expect(input).toBeTruthy();

    // Verify input has appropriate mobile styling for readability
    expect(input.props.style).toMatchObject(
      expect.objectContaining({
        fontSize: expect.any(Number),
        padding: expect.any(Number),
      })
    );

    // Verify font size is readable on mobile (at least 14px)
    expect(input.props.style.fontSize).toBeGreaterThanOrEqual(14);

    const translateButton = getByTestId('translate-button');
    expect(translateButton).toBeTruthy();

    // Verify button is accessible (has sufficient touch target)
    expect(translateButton.props.accessible).not.toBe(false);
    expect(translateButton.props.style).toMatchObject(
      expect.objectContaining({
        padding: expect.any(Number),
      })
    );

    // Verify button has adequate padding for touch targets (at least 10px)
    expect(translateButton.props.style.padding).toBeGreaterThanOrEqual(10);

    // AND: text should be readable without horizontal scrolling
    // Verify that the multiline input is enabled for proper text wrapping
    expect(input.props.multiline).toBe(true);
  });
});
