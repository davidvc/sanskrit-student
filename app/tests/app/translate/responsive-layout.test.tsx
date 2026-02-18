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

    // Verify input has NativeWind classes for responsive mobile styling
    expect(input.props.className).toBeDefined();
    expect(input.props.className).toContain('p-'); // Has padding
    expect(input.props.className).toContain('text-'); // Has text size

    const translateButton = getByTestId('translate-button');
    expect(translateButton).toBeTruthy();

    // Verify button is accessible with NativeWind classes
    expect(translateButton.props.accessible).not.toBe(false);
    expect(translateButton.props.className).toBeDefined();
    expect(translateButton.props.className).toContain('p-'); // Has padding for touch targets

    // AND: text should be readable without horizontal scrolling
    // Verify that the multiline input is enabled for proper text wrapping
    expect(input.props.multiline).toBe(true);
  });
});
